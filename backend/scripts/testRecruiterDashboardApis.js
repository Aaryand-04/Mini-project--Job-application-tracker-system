const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const { Applicant, Company, JobPosting, Resume, Application, Notification } = require('../models');
const { generateToken } = require('../utils/jwt');

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step15_2026';

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
  console.log('🧪 Starting Recruiter Dashboard Test Suite (Step 15)...\n');

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

    // 1. Unauthenticated and Unauthorized Access Tests
    console.log('\n--- 1. Authentication & Role Validation Tests ---');
    const unauthRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/dashboard'
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated request to /api/recruiter/dashboard returns 401');

    const unauthStatsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications/dashboard-stats'
    });
    assert(unauthStatsRes.statusCode === 401, 'Unauthenticated request to /api/recruiter/applications/dashboard-stats returns 401');

    // Create an applicant and try to access recruiter dashboard
    const testApplicant = await Applicant.create({
      name: 'Unauthorized Applicant',
      email: `applicant_${timestamp}@test.com`,
      password: 'Password123!',
      phone: '1234567890',
      location: 'Pune',
      skills: 'JavaScript'
    });
    const applicantToken = generateToken({ id: testApplicant._id, role: 'applicant' });

    const forbiddenRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/dashboard',
      headers: { Authorization: `Bearer ${applicantToken}` }
    });
    assert(forbiddenRes.statusCode === 403, 'Applicant accessing /api/recruiter/dashboard returns 403 Forbidden');

    // 2. Recruiter Setup & Zero State Test
    console.log('\n--- 2. Recruiter 1 Zero State Tests ---');
    const company1 = await Company.create({
      name: `InnovateTech Corp ${timestamp}`,
      email: `recruiter1_${timestamp}@innovatetech.com`,
      password: 'Password123!',
      industry: 'Cloud Infrastructure',
      location: 'Bangalore, India',
      website: 'https://innovatetech.com'
    });
    const recruiter1Token = generateToken({ id: company1._id, role: 'recruiter' });

    const zeroRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/dashboard',
      headers: { Authorization: `Bearer ${recruiter1Token}` }
    });
    assert(zeroRes.statusCode === 200, 'Recruiter 1 accesses /api/recruiter/dashboard returns 200');
    assert(zeroRes.body.success === true, 'Response body success is true');
    assert(zeroRes.body.stats !== undefined, 'Stats object is returned');
    assert(zeroRes.body.stats.totalJobPostings === 0, 'Zero state totalJobPostings is 0');
    assert(zeroRes.body.stats.activeJobs === 0, 'Zero state activeJobs is 0');
    assert(zeroRes.body.stats.closedJobs === 0, 'Zero state closedJobs is 0');
    assert(zeroRes.body.stats.totalApplications === 0, 'Zero state totalApplications is 0');
    assert(zeroRes.body.stats.newApplications === 0, 'Zero state newApplications is 0');
    assert(zeroRes.body.stats.shortlisted === 0, 'Zero state shortlisted is 0');
    assert(zeroRes.body.stats.rejected === 0, 'Zero state rejected is 0');
    assert(zeroRes.body.stats.hired === 0, 'Zero state hired is 0');
    assert(Array.isArray(zeroRes.body.recentApplications) && zeroRes.body.recentApplications.length === 0, 'Zero state recentApplications is empty array');
    assert(Array.isArray(zeroRes.body.recentJobs) && zeroRes.body.recentJobs.length === 0, 'Zero state recentJobs is empty array');
    assert(Array.isArray(zeroRes.body.recentNotifications) && zeroRes.body.recentNotifications.length === 0, 'Zero state recentNotifications is empty array');

    // 3. Creating Jobs (Active & Closed)
    console.log('\n--- 3. Job Postings Count Verification (Active vs Closed) ---');
    const job1 = await JobPosting.create({
      companyId: company1._id,
      title: 'Senior Cloud Architect',
      description: 'Design robust distributed systems on Kubernetes and AWS.',
      location: 'Bangalore, India',
      type: 'Full-time',
      experienceLevel: 'Senior Level',
      isActive: true
    });

    const job2 = await JobPosting.create({
      companyId: company1._id,
      title: 'Backend Node.js Engineer',
      description: 'Develop high throughput microservices using Node and Express.',
      location: 'Remote',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      isActive: true
    });

    const job3 = await JobPosting.create({
      companyId: company1._id,
      title: 'DevOps Intern',
      description: 'Assist with CI/CD pipeline automation and monitoring.',
      location: 'Bangalore, India',
      type: 'Internship',
      experienceLevel: 'Entry Level',
      isActive: false // Closed job
    });

    const afterJobsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/dashboard',
      headers: { Authorization: `Bearer ${recruiter1Token}` }
    });
    assert(afterJobsRes.statusCode === 200, 'Dashboard fetched after job postings created');
    assert(afterJobsRes.body.stats.totalJobPostings === 3, 'totalJobPostings is dynamically 3');
    assert(afterJobsRes.body.stats.activeJobs === 2, 'activeJobs is dynamically 2');
    assert(afterJobsRes.body.stats.closedJobs === 1, 'closedJobs is dynamically 1');
    assert(afterJobsRes.body.recentJobs.length === 3, 'recentJobs contains the 3 postings');
    assert(afterJobsRes.body.recentJobs[0].title !== undefined, 'recentJobs populated with title');

    // 4. Candidate Applications & Status Pipeline Aggregations
    console.log('\n--- 4. Applications Pipeline Aggregations (Applied, Shortlisted, Hired, Rejected) ---');
    // Create 4 candidates and resumes
    const dummyUploadDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(dummyUploadDir)) {
      fs.mkdirSync(dummyUploadDir, { recursive: true });
    }
    const sampleResumePath = path.join(dummyUploadDir, `test_resume_${timestamp}.pdf`);
    fs.writeFileSync(sampleResumePath, '%PDF-1.4 Fake PDF Content for Step 15 test');

    const cand1 = await Applicant.create({
      name: 'Alice Turing',
      email: `alice_${timestamp}@test.com`,
      password: 'Password123!',
      phone: '1112223333',
      location: 'London'
    });
    const resume1 = await Resume.create({
      applicantId: cand1._id,
      fileName: 'alice_resume.pdf',
      filePath: sampleResumePath,
      fileSize: 1024,
      fileType: 'application/pdf'
    });

    const cand2 = await Applicant.create({
      name: 'Bob Cerf',
      email: `bob_${timestamp}@test.com`,
      password: 'Password123!',
      phone: '2223334444',
      location: 'San Francisco'
    });
    const resume2 = await Resume.create({
      applicantId: cand2._id,
      fileName: 'bob_resume.pdf',
      filePath: sampleResumePath,
      fileSize: 1024,
      fileType: 'application/pdf'
    });

    const cand3 = await Applicant.create({
      name: 'Charlie Ritchie',
      email: `charlie_${timestamp}@test.com`,
      password: 'Password123!',
      phone: '3334445555',
      location: 'Boston'
    });
    const resume3 = await Resume.create({
      applicantId: cand3._id,
      fileName: 'charlie_resume.pdf',
      filePath: sampleResumePath,
      fileSize: 1024,
      fileType: 'application/pdf'
    });

    const cand4 = await Applicant.create({
      name: 'Diana Lamport',
      email: `diana_${timestamp}@test.com`,
      password: 'Password123!',
      phone: '4445556666',
      location: 'Zurich'
    });
    const resume4 = await Resume.create({
      applicantId: cand4._id,
      fileName: 'diana_resume.pdf',
      filePath: sampleResumePath,
      fileSize: 1024,
      fileType: 'application/pdf'
    });

    // Create 4 applications:
    // app1: Applied (New)
    const app1 = await Application.create({
      applicantId: cand1._id,
      jobId: job1._id,
      resumeId: resume1._id,
      status: 'Applied',
      coverLetter: 'Passionate about cloud architecture.'
    });

    // app2: Shortlisted
    const app2 = await Application.create({
      applicantId: cand2._id,
      jobId: job1._id,
      resumeId: resume2._id,
      status: 'Shortlisted',
      coverLetter: 'Extensive Kubernetes background.'
    });

    // app3: Hired
    const app3 = await Application.create({
      applicantId: cand3._id,
      jobId: job2._id,
      resumeId: resume3._id,
      status: 'Hired',
      coverLetter: 'Expert in Node.js internals.'
    });

    // app4: Rejected
    const app4 = await Application.create({
      applicantId: cand4._id,
      jobId: job2._id,
      resumeId: resume4._id,
      status: 'Rejected',
      coverLetter: 'Strong enthusiasm.'
    });

    // Create a recruiter notification for company1
    await Notification.create({
      recipientId: company1._id,
      recipientRole: 'recruiter',
      title: 'New Application Received',
      message: `${cand1.name} submitted an application for ${job1.title}.`,
      type: 'NEW_APPLICATION',
      applicationId: app1._id,
      applicantName: cand1.name,
      jobTitle: job1.title,
      isRead: false
    });

    const statsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/dashboard',
      headers: { Authorization: `Bearer ${recruiter1Token}` }
    });

    assert(statsRes.statusCode === 200, 'Fetched recruiter dashboard with applications');
    const stats = statsRes.body.stats;
    assert(stats.totalApplications === 4, 'totalApplications matches dynamic count of 4');
    assert(stats.newApplications === 1, 'newApplications (Applied) matches dynamic count of 1');
    assert(stats.shortlisted === 1, 'shortlisted matches dynamic count of 1');
    assert(stats.hired === 1, 'hired matches dynamic count of 1');
    assert(stats.rejected === 1, 'rejected matches dynamic count of 1');

    // 5. Verify Populated Recent Applications and Notifications
    console.log('\n--- 5. Verify Populated Recent Applications & Notifications ---');
    assert(Array.isArray(statsRes.body.recentApplications), 'recentApplications is an array');
    assert(statsRes.body.recentApplications.length === 4, 'recentApplications returns all 4 submissions');
    const firstRecentApp = statsRes.body.recentApplications[0];
    assert(firstRecentApp.applicantId && firstRecentApp.applicantId.name !== undefined, 'recentApplication applicantId is populated with name');
    assert(firstRecentApp.applicantId.email !== undefined, 'recentApplication applicantId is populated with email');
    assert(firstRecentApp.jobId && firstRecentApp.jobId.title !== undefined, 'recentApplication jobId is populated with title');

    assert(Array.isArray(statsRes.body.recentNotifications), 'recentNotifications is an array');
    assert(statsRes.body.recentNotifications.length >= 1, 'recentNotifications contains at least 1 notification');
    assert(statsRes.body.recentNotifications[0].title === 'New Application Received', 'Notification title matches');

    // Also verify the alternate route alias /api/recruiter/applications/dashboard-stats
    const aliasRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications/dashboard-stats',
      headers: { Authorization: `Bearer ${recruiter1Token}` }
    });
    assert(aliasRes.statusCode === 200, 'Alternate alias /api/recruiter/applications/dashboard-stats returns 200');
    assert(aliasRes.body.stats.totalApplications === 4, 'Alternate alias returns identical aggregated stats');

    // 6. Cross-Company Data Isolation Test
    console.log('\n--- 6. Cross-Company Data Isolation Test ---');
    const company2 = await Company.create({
      name: `Competitor Labs ${timestamp}`,
      email: `recruiter2_${timestamp}@competitor.com`,
      password: 'Password123!',
      industry: 'Cybersecurity',
      location: 'Mumbai, India'
    });
    const recruiter2Token = generateToken({ id: company2._id, role: 'recruiter' });

    const company2Res = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/dashboard',
      headers: { Authorization: `Bearer ${recruiter2Token}` }
    });

    assert(company2Res.statusCode === 200, 'Recruiter 2 accesses their dashboard');
    const stats2 = company2Res.body.stats;
    assert(stats2.totalJobPostings === 0, 'Company 2 totalJobPostings is 0 (isolated from Company 1)');
    assert(stats2.activeJobs === 0, 'Company 2 activeJobs is 0');
    assert(stats2.closedJobs === 0, 'Company 2 closedJobs is 0');
    assert(stats2.totalApplications === 0, 'Company 2 totalApplications is 0 (does NOT see Company 1 applications)');
    assert(stats2.newApplications === 0, 'Company 2 newApplications is 0');
    assert(stats2.shortlisted === 0, 'Company 2 shortlisted is 0');
    assert(stats2.hired === 0, 'Company 2 hired is 0');
    assert(stats2.rejected === 0, 'Company 2 rejected is 0');
    assert(company2Res.body.recentApplications.length === 0, 'Company 2 recentApplications is empty');
    assert(company2Res.body.recentJobs.length === 0, 'Company 2 recentJobs is empty');
    assert(company2Res.body.recentNotifications.length === 0, 'Company 2 recentNotifications is empty');

    // Clean up sample resume file
    if (fs.existsSync(sampleResumePath)) {
      fs.unlinkSync(sampleResumePath);
    }

    console.log(`\n🎉 All ${testsPassed}/${totalTests} Recruiter Dashboard tests passed successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
