const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const { Applicant, Company, JobPosting, Resume, Application, Notification } = require('../models');
const { generateToken } = require('../utils/jwt');

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step14_2026';

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
  console.log('🧪 Starting Applicant Dashboard Test Suite (Step 14)...\n');

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

    // 1. Setting Up Test Data
    console.log('\n--- 1. Setting Up Test Applicants, Companies, & Jobs ---');
    const applicant1 = await Applicant.create({
      name: 'Grace Hopper',
      email: `grace_${timestamp}@dashboard.test`,
      password: 'Password123!',
      phone: '9876543210',
      location: 'New York, USA',
      skills: 'Compilers, COBOL'
    });
    const applicant1Token = generateToken({ id: applicant1._id, role: 'applicant' });

    const applicant2 = await Applicant.create({
      name: 'Claude Shannon',
      email: `claude_${timestamp}@dashboard.test`,
      password: 'Password123!',
      phone: '9876543211',
      location: 'Boston, USA',
      skills: 'Information Theory, Logic'
    });
    const applicant2Token = generateToken({ id: applicant2._id, role: 'applicant' });

    const companyA = await Company.create({
      name: `Bell Labs ${timestamp}`,
      email: `bell_${timestamp}@dashboard.test`,
      password: 'Password123!',
      industry: 'Telecommunications',
      location: 'New Jersey, USA',
      website: 'https://bell-labs.test'
    });
    const companyAToken = generateToken({ id: companyA._id, role: 'recruiter' });

    const resume1 = await Resume.create({
      applicantId: applicant1._id,
      fileName: 'grace_resume.pdf',
      filePath: 'uploads/resumes/dummy_grace.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf'
    });

    const resume2 = await Resume.create({
      applicantId: applicant2._id,
      fileName: 'claude_resume.pdf',
      filePath: 'uploads/resumes/dummy_claude.pdf',
      fileSize: 524288,
      mimeType: 'application/pdf'
    });

    // Create 4 jobs
    const job1 = await JobPosting.create({
      title: 'Compiler Systems Architect',
      description: 'Build modern machine compilers.',
      location: 'New York, USA',
      type: 'Full-time',
      experienceLevel: 'Senior Level',
      companyId: companyA._id,
      isActive: true
    });

    const job2 = await JobPosting.create({
      title: 'Operating Systems Engineer',
      description: 'Develop low level OS modules.',
      location: 'Remote',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      companyId: companyA._id,
      isActive: true
    });

    const job3 = await JobPosting.create({
      title: 'Information Theorist',
      description: 'Entropy and digital communications research.',
      location: 'New Jersey, USA',
      type: 'Full-time',
      experienceLevel: 'Lead / Executive',
      companyId: companyA._id,
      isActive: true
    });

    const job4 = await JobPosting.create({
      title: 'Hardware Circuit Designer',
      description: 'Relay and vacuum tube circuits.',
      location: 'Boston, USA',
      type: 'Contract',
      experienceLevel: 'Entry Level',
      companyId: companyA._id,
      isActive: true
    });

    console.log('Seed data created.');

    // 2. Authentication & Access Control on Dashboard API
    console.log('\n--- 2. Testing Authentication & Role Access Control ---');
    // Unauthenticated
    const unauthRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications/dashboard-stats'
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated GET /api/applications/dashboard-stats returns 401 Unauthorized');

    // Recruiter calling applicant dashboard
    const recruiterCallRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications/dashboard-stats',
      headers: { Authorization: `Bearer ${companyAToken}` }
    });
    assert(recruiterCallRes.statusCode === 403, 'Recruiter account blocked from applicant dashboard (403 Forbidden)');

    // 3. Initial Dashboard State (0 applications submitted)
    console.log('\n--- 3. Testing Initial Zero State Dashboard ---');
    const initialDashRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications/dashboard-stats',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(initialDashRes.statusCode === 200, 'Applicant 1 dashboard fetched successfully (200 OK)');
    const initialStats = initialDashRes.body.stats;
    assert(initialStats.total === 0, 'Initial Total Applications is 0');
    assert(initialStats.applied === 0, 'Initial Applied count is 0');
    assert(initialStats.shortlisted === 0, 'Initial Shortlisted count is 0');
    assert(initialStats.rejected === 0, 'Initial Rejected count is 0');
    assert(initialStats.hired === 0, 'Initial Hired count is 0');
    assert(Array.isArray(initialDashRes.body.recentApplications), 'recentApplications is an array');
    assert(initialDashRes.body.recentApplications.length === 0, 'recentApplications is empty initially');
    assert(Array.isArray(initialDashRes.body.activeJobs), 'activeJobs is an array');
    assert(initialDashRes.body.activeJobs.length >= 4, 'activeJobs returns active job opportunities');

    // 4. Submitting Applications & Transitioning States
    console.log('\n--- 4. Submitting Applications Across Distinct Statuses ---');
    // App 1 -> Job 1 (will remain Applied)
    const appRes1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: {
        jobId: job1._id.toString(),
        resumeId: resume1._id.toString(),
        coverLetter: 'Applying for Compiler Architect',
        notes: 'Notice: Immediate'
      }
    });
    assert(appRes1.statusCode === 201, 'Application 1 submitted (Applied)');
    const app1Id = appRes1.body.application._id;

    // App 2 -> Job 2 (will transition to Shortlisted)
    const appRes2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: {
        jobId: job2._id.toString(),
        resumeId: resume1._id.toString(),
        coverLetter: 'Applying for OS Engineer',
        notes: 'Notice: 2 weeks'
      }
    });
    assert(appRes2.statusCode === 201, 'Application 2 submitted');
    const app2Id = appRes2.body.application._id;

    // Recruiter shortlists App 2
    const shortlistRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app2Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: { status: 'Shortlisted', notes: 'Shortlisted for OS engineering.' }
    });
    assert(shortlistRes.statusCode === 200, 'Application 2 updated to Shortlisted');

    // App 3 -> Job 3 (will transition to Shortlisted -> Hired)
    const appRes3 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: {
        jobId: job3._id.toString(),
        resumeId: resume1._id.toString(),
        coverLetter: 'Applying for Information Theorist',
        notes: 'Notice: Immediate'
      }
    });
    assert(appRes3.statusCode === 201, 'Application 3 submitted');
    const app3Id = appRes3.body.application._id;

    // Recruiter updates App 3: Applied -> Shortlisted -> Hired
    await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app3Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: { status: 'Shortlisted' }
    });
    const hiredRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app3Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: { status: 'Hired', notes: 'Top candidate!' }
    });
    assert(hiredRes.statusCode === 200, 'Application 3 updated to Hired');

    // App 4 -> Job 4 (will transition to Rejected)
    const appRes4 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: {
        jobId: job4._id.toString(),
        resumeId: resume1._id.toString(),
        coverLetter: 'Applying for Circuit Designer',
        notes: 'Notice: None'
      }
    });
    assert(appRes4.statusCode === 201, 'Application 4 submitted');
    const app4Id = appRes4.body.application._id;

    // Recruiter rejects App 4
    const rejectRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app4Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: { status: 'Rejected', notes: 'Position closed.' }
    });
    assert(rejectRes.statusCode === 200, 'Application 4 updated to Rejected');

    // 5. Test MongoDB Aggregated Statistics for Applicant 1
    console.log('\n--- 5. Verifying Computed MongoDB Aggregated Statistics ---');
    const dashRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications/dashboard-stats',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(dashRes.statusCode === 200, 'Fetched Applicant 1 live dashboard (200 OK)');
    const stats = dashRes.body.stats;

    assert(stats.total === 4, 'Total Applications correctly calculated as 4');
    assert(stats.applied === 1, 'Applied count correctly calculated as 1');
    assert(stats.shortlisted === 1, 'Shortlisted count correctly calculated as 1');
    assert(stats.hired === 1, 'Hired count correctly calculated as 1');
    assert(stats.rejected === 1, 'Rejected count correctly calculated as 1');
    assert(
      stats.applied + stats.shortlisted + stats.hired + stats.rejected === stats.total,
      'Sum of breakdown counts exactly equals total applications'
    );

    // Also test alias route /api/applicant/dashboard
    const aliasDashRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applicant/dashboard',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(aliasDashRes.statusCode === 200, 'Alias route /api/applicant/dashboard returns 200 OK');
    assert(aliasDashRes.body.stats.total === 4, 'Alias route returns identical total stats');

    // 6. Test Recent Applications Content & Population
    console.log('\n--- 6. Verifying Recent Applications Section ---');
    const recentApps = dashRes.body.recentApplications;
    assert(recentApps.length === 4, 'Recent applications returns all 4 applications');
    const firstApp = recentApps[0];
    assert(Boolean(firstApp.jobId?.title), 'Recent application has populated Job Title');
    assert(Boolean(firstApp.jobId?.companyId?.name), 'Recent application has populated Company Name');
    assert(Boolean(firstApp.status), 'Recent application has status');
    assert(Boolean(firstApp.appliedDate), 'Recent application has appliedDate');

    // 7. Test Recent Notifications Section
    console.log('\n--- 7. Verifying Recent Notifications Section ---');
    const recentNotifs = dashRes.body.recentNotifications;
    assert(recentNotifs.length > 0, 'Recent notifications contains entries from submission & status updates');
    const firstNotif = recentNotifs[0];
    assert(Boolean(firstNotif.title), 'Notification has title');
    assert(Boolean(firstNotif.message), 'Notification has message');
    assert(Boolean(firstNotif.type), 'Notification has type');

    // 8. Test Strict Data Isolation between Applicants
    console.log('\n--- 8. Testing Strict Applicant Data Isolation ---');
    // Applicant 2 submits 1 application
    const app2SubRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant2Token}`
      },
      body: {
        jobId: job1._id.toString(),
        resumeId: resume2._id.toString(),
        coverLetter: 'Claude Shannon applying',
        notes: 'Immediate'
      }
    });
    assert(app2SubRes.statusCode === 201, 'Applicant 2 submitted 1 application');

    // Check Applicant 2 dashboard
    const app2DashRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applicant/dashboard',
      headers: { Authorization: `Bearer ${applicant2Token}` }
    });
    assert(app2DashRes.statusCode === 200, 'Applicant 2 dashboard fetched successfully');
    const app2Stats = app2DashRes.body.stats;
    assert(app2Stats.total === 1, 'Applicant 2 sees exactly total: 1');
    assert(app2Stats.applied === 1, 'Applicant 2 sees exactly applied: 1');
    assert(app2Stats.shortlisted === 0, 'Applicant 2 sees shortlisted: 0');
    assert(app2DashRes.body.recentApplications.length === 1, 'Applicant 2 sees only their 1 recent application');
    assert(
      app2DashRes.body.recentApplications[0]._id === app2SubRes.body.application._id,
      'Applicant 2 sees their own application and not Applicant 1’s'
    );

    // Verify Applicant 1's stats remain strictly 4 (unaffected by Applicant 2)
    const app1CheckRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applicant/dashboard',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(app1CheckRes.body.stats.total === 4, 'Applicant 1 stats unchanged at total: 4 (isolated from Applicant 2)');

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
