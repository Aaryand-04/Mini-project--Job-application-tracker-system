const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const { Applicant, Company, JobPosting, Resume, Application, Notification } = require('../models');
const { generateToken } = require('../utils/jwt');

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step12_2026';

let server;
let baseUrl;
let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function makeRequest({ method, urlPath, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Applicant Application Tracking Test Suite (Step 12)...\n');

  try {
    // 0. Connect DB if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job_application_tracker');
    }

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`📡 Test server running on ${baseUrl}`);
        resolve();
      });
    });

    const timestamp = Date.now();

    // 1. Create two applicants
    console.log('\n--- 1. Setting Up Test Applicants & Companies ---');
    const applicant1 = await Applicant.create({
      name: 'Applicant One',
      email: `applicant1_${timestamp}@tracking.test`,
      password: 'Password123!',
      phone: '9876543210',
      location: 'Bangalore, India',
      skills: 'React, Node.js'
    });
    const applicant1Token = generateToken({ id: applicant1._id, role: 'applicant' });

    const applicant2 = await Applicant.create({
      name: 'Applicant Two',
      email: `applicant2_${timestamp}@tracking.test`,
      password: 'Password123!',
      phone: '9876543211',
      location: 'Pune, India',
      skills: 'Python, Django'
    });
    const applicant2Token = generateToken({ id: applicant2._id, role: 'applicant' });

    // Create Company A & Recruiter
    const companyA = await Company.create({
      name: `Alpha Tracking Tech ${timestamp}`,
      email: `alpha_${timestamp}@tracking.test`,
      password: 'Password123!',
      industry: 'Software',
      location: 'Bangalore, India',
      website: 'https://alpha-tech.test'
    });
    const companyAToken = generateToken({ id: companyA._id, role: 'recruiter' });

    // Create Company B & Recruiter
    const companyB = await Company.create({
      name: `Beta Tracking Solutions ${timestamp}`,
      email: `beta_${timestamp}@tracking.test`,
      password: 'Password123!',
      industry: 'Cloud Computing',
      location: 'Hyderabad, India',
      website: 'https://beta-cloud.test'
    });
    const companyBToken = generateToken({ id: companyB._id, role: 'recruiter' });

    // Resumes
    const resume1 = await Resume.create({
      applicantId: applicant1._id,
      fileName: 'applicant1_resume.pdf',
      filePath: 'uploads/resumes/dummy_applicant1.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf'
    });

    const resume2 = await Resume.create({
      applicantId: applicant2._id,
      fileName: 'applicant2_resume.pdf',
      filePath: 'uploads/resumes/dummy_applicant2.pdf',
      fileSize: 524288,
      mimeType: 'application/pdf'
    });

    // Jobs
    const jobA1 = await JobPosting.create({
      title: 'Full Stack Engineer (Alpha)',
      description: 'Exciting role working on modern MERN stack.',
      location: 'Bangalore, India',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      companyId: companyA._id,
      isActive: true
    });

    const jobA2 = await JobPosting.create({
      title: 'DevOps Specialist (Alpha)',
      description: 'Kubernetes and CI/CD pipeline architect.',
      location: 'Remote',
      type: 'Contract',
      experienceLevel: 'Senior Level',
      companyId: companyA._id,
      isActive: true
    });

    const jobB1 = await JobPosting.create({
      title: 'Backend Engineer (Beta)',
      description: 'High throughput distributed systems developer.',
      location: 'Hyderabad, India',
      type: 'Full-time',
      experienceLevel: 'Entry Level',
      companyId: companyB._id,
      isActive: true
    });

    console.log('Seed data created successfully.');

    // 2. Test Submissions
    console.log('\n--- 2. Submitting Test Applications ---');
    // Applicant 1 submits to Job A1 (will transition to Shortlisted -> Hired)
    const appRes1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: {
        jobId: jobA1._id.toString(),
        resumeId: resume1._id.toString(),
        coverLetter: 'I am excited about this Full Stack position at Alpha!',
        notes: 'Available immediately'
      }
    });
    assert(appRes1.statusCode === 201, 'Applicant 1 applied to Job A1 successfully (201)');
    const app1Id = appRes1.body.application._id;

    // Applicant 1 submits to Job A2 (will transition to Rejected directly)
    const appRes2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: {
        jobId: jobA2._id.toString(),
        resumeId: resume1._id.toString(),
        coverLetter: 'Applying for DevOps role at Alpha.',
        notes: 'Notice period: 15 days'
      }
    });
    assert(appRes2.statusCode === 201, 'Applicant 1 applied to Job A2 successfully (201)');
    const app2Id = appRes2.body.application._id;

    // Applicant 2 submits to Job B1
    const appRes3 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant2Token}`
      },
      body: {
        jobId: jobB1._id.toString(),
        resumeId: resume2._id.toString(),
        coverLetter: 'Applying for Backend position at Beta.',
        notes: 'Fresh graduate'
      }
    });
    assert(appRes3.statusCode === 201, 'Applicant 2 applied to Job B1 successfully (201)');
    const app3Id = appRes3.body.application._id;

    // 3. Test GET /api/applications Authentication & Access Control
    console.log('\n--- 3. Testing GET /api/applications Authentication & Access Control ---');
    // Unauthenticated
    const unauthListRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications'
    });
    assert(unauthListRes.statusCode === 401, 'Unauthenticated GET /api/applications rejected with 401');

    // Recruiter token on applicant endpoint
    const recruiterOnApplicantRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications',
      headers: { Authorization: `Bearer ${companyAToken}` }
    });
    assert(
      recruiterOnApplicantRes.statusCode === 403,
      'Recruiter forbidden from accessing applicant endpoint GET /api/applications (403)'
    );

    // 4. Test Strict Applicant Data Isolation on GET /api/applications
    console.log('\n--- 4. Testing Strict Applicant Data Isolation on GET /api/applications ---');
    const app1ListRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(app1ListRes.statusCode === 200, 'Applicant 1 retrieved applications with 200 OK');
    assert(app1ListRes.body.count === 2, 'Applicant 1 sees exactly their 2 applications');
    const app1RetrievedIds = app1ListRes.body.applications.map(a => a._id);
    assert(
      app1RetrievedIds.includes(app1Id) && app1RetrievedIds.includes(app2Id),
      'Applicant 1 list contains both of Applicant 1’s applications'
    );
    assert(
      !app1RetrievedIds.includes(app3Id),
      'Applicant 1 list strictly EXCLUDES Applicant 2’s application'
    );

    // Applicant 2 retrieves list
    const app2ListRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications',
      headers: { Authorization: `Bearer ${applicant2Token}` }
    });
    assert(app2ListRes.statusCode === 200, 'Applicant 2 retrieved applications with 200 OK');
    assert(app2ListRes.body.count === 1, 'Applicant 2 sees exactly their 1 application');
    assert(app2ListRes.body.applications[0]._id === app3Id, 'Applicant 2 sees only their own application (app3)');

    // 5. Test Query Filters: status and search
    console.log('\n--- 5. Testing Query Filters (status & search) ---');
    const filterSearchRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications?search=DevOps',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(filterSearchRes.statusCode === 200, 'Search filter returned 200');
    assert(filterSearchRes.body.count === 1, 'Search for "DevOps" filtered correctly to 1 application');
    assert(filterSearchRes.body.applications[0]._id === app2Id, 'Returned correct DevOps application');

    // 6. Test Initial Status Timeline on GET /api/applications/:id
    console.log('\n--- 6. Testing Initial Status Timeline on GET /api/applications/:id ---');
    const app1DetailInitial = await makeRequest({
      method: 'GET',
      urlPath: `/api/applications/${app1Id}`,
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(app1DetailInitial.statusCode === 200, 'Applicant 1 fetched application details (200 OK)');
    const initialData = app1DetailInitial.body.application;
    assert(initialData.status === 'Applied', 'Initial status is "Applied"');
    assert(initialData.jobId.title === 'Full Stack Engineer (Alpha)', 'Correct Job title returned');
    assert(initialData.jobId.companyId.name.includes('Alpha Tracking Tech'), 'Correct Company returned');
    assert(initialData.resumeId.fileName === 'applicant1_resume.pdf', 'Correct Resume fileName returned');
    assert(initialData.coverLetter.includes('Full Stack position'), 'Correct Cover Letter returned');
    assert(initialData.notes === 'Available immediately', 'Correct applicant notes returned');
    assert(Array.isArray(initialData.statusHistory), 'statusHistory is an array');
    assert(initialData.statusHistory.length === 1, 'Timeline contains exactly 1 initial state ("Applied")');
    assert(initialData.statusHistory[0].status === 'Applied', 'Initial timeline state is "Applied"');

    // 7. Test Cross-Applicant Isolation on GET /api/applications/:id
    console.log('\n--- 7. Testing Cross-Applicant Isolation on GET /api/applications/:id ---');
    // Applicant 2 attempts to access Applicant 1's application
    const crossAccessRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/applications/${app1Id}`,
      headers: { Authorization: `Bearer ${applicant2Token}` }
    });
    assert(
      crossAccessRes.statusCode === 403,
      'Applicant 2 forbidden from accessing Applicant 1’s application (403 Forbidden)'
    );
    assert(
      crossAccessRes.body.success === false,
      'Forbidden error response returned success: false'
    );

    // 8. Test Applicant Immutability Constraint (Applicant cannot modify status)
    console.log('\n--- 8. Testing Applicant Immutability Constraint ---');
    const applicantStatusMutateRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: { status: 'Hired' }
    });
    assert(
      applicantStatusMutateRes.statusCode === 403,
      'Applicant forbidden from modifying recruiter-controlled status (403 Forbidden)'
    );

    // 9. Recruiter Updates Status & Verify Timeline Evolution: Applied -> Shortlisted -> Hired
    console.log('\n--- 9. Recruiter Updates Application 1: Applied -> Shortlisted -> Hired ---');
    // Step A: Update to Shortlisted
    const shortlistRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app1Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: {
        status: 'Shortlisted',
        notes: 'Impressive MERN stack portfolio. Invited to technical round.'
      }
    });
    assert(shortlistRes.statusCode === 200, 'Recruiter updated status to Shortlisted (200 OK)');

    // Applicant inspects timeline after Shortlisting
    const app1AfterShortlist = await makeRequest({
      method: 'GET',
      urlPath: `/api/applications/${app1Id}`,
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(app1AfterShortlist.statusCode === 200, 'Applicant fetched application after Shortlist (200)');
    const shortlistData = app1AfterShortlist.body.application;
    assert(shortlistData.status === 'Shortlisted', 'Status is now Shortlisted');
    assert(shortlistData.statusHistory.length === 2, 'Timeline now contains exactly 2 actual states');
    assert(shortlistData.statusHistory[0].status === 'Applied', 'Timeline Step 1: Applied');
    assert(shortlistData.statusHistory[1].status === 'Shortlisted', 'Timeline Step 2: Shortlisted');

    // Step B: Update to Hired
    const hiredRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app1Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: {
        status: 'Hired',
        notes: 'Aced technical assessment and culture fit. Offer extended & accepted.'
      }
    });
    assert(hiredRes.statusCode === 200, 'Recruiter updated status to Hired (200 OK)');

    // Applicant inspects timeline after Hired
    const app1AfterHired = await makeRequest({
      method: 'GET',
      urlPath: `/api/applications/${app1Id}`,
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(app1AfterHired.statusCode === 200, 'Applicant fetched application after Hired (200)');
    const hiredData = app1AfterHired.body.application;
    assert(hiredData.status === 'Hired', 'Status is now Hired');
    assert(hiredData.statusHistory.length === 3, 'Timeline contains exactly 3 actual states (Applied -> Shortlisted -> Hired)');
    assert(hiredData.statusHistory[0].status === 'Applied', 'Timeline Step 1 is Applied');
    assert(hiredData.statusHistory[1].status === 'Shortlisted', 'Timeline Step 2 is Shortlisted');
    assert(hiredData.statusHistory[2].status === 'Hired', 'Timeline Step 3 is Hired');

    // 10. Recruiter Directly Rejects Application 2: Applied -> Rejected
    console.log('\n--- 10. Recruiter Updates Application 2: Direct Applied -> Rejected ---');
    const rejectRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app2Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: {
        status: 'Rejected',
        notes: 'Position filled internally.'
      }
    });
    assert(rejectRes.statusCode === 200, 'Recruiter updated Application 2 to Rejected (200 OK)');

    // Applicant inspects Application 2 timeline
    const app2Detail = await makeRequest({
      method: 'GET',
      urlPath: `/api/applications/${app2Id}`,
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(app2Detail.statusCode === 200, 'Applicant fetched Application 2 details (200)');
    const rejectData = app2Detail.body.application;
    assert(rejectData.status === 'Rejected', 'Status is Rejected');
    assert(
      rejectData.statusHistory.length === 2,
      'Timeline for direct rejection contains ONLY 2 actual states (Applied -> Rejected)'
    );
    assert(rejectData.statusHistory[0].status === 'Applied', 'Timeline Step 1 is Applied');
    assert(rejectData.statusHistory[1].status === 'Rejected', 'Timeline Step 2 is Rejected');
    const stepStatuses = rejectData.statusHistory.map(s => s.status);
    assert(
      !stepStatuses.includes('Shortlisted') && !stepStatuses.includes('Hired'),
      'Timeline strictly does NOT show unreached states (Shortlisted, Hired)'
    );

    // 11. Recruiter from Company B cannot access or update Application 1 (Company Isolation)
    console.log('\n--- 11. Company Isolation on Status Management ---');
    const crossCompanyStatusRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app1Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyBToken}`
      },
      body: { status: 'Rejected' }
    });
    assert(
      crossCompanyStatusRes.statusCode === 403,
      'Recruiter from Company B forbidden from modifying Company A’s application status (403)'
    );

    console.log(`\n🎉 ALL TESTS PASSED! (${testsPassed}/${totalTests})`);
  } catch (err) {
    console.error('\n❌ Test Suite encountered an error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

runTests();
