const http = require('http');
const { connectDB } = require('../config/db');
const { Applicant, Company, JobPosting, Resume, Application, Notification } = require('../models');
const app = require('../server');

let server;
let baseUrl;

function makeRequest({ method = 'GET', urlPath, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(baseUrl + urlPath);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const rawBody = Buffer.concat(chunks);
        let json = null;
        try {
          json = JSON.parse(rawBody.toString('utf8'));
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          rawBody
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Application Processing & Notification Test Suite (Step 9)...\n');
  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    await connectDB();

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`📡 Test server running on ${baseUrl}\n`);
        resolve();
      });
    });

    // 1. Create Recruiter 1
    const uniqueSuffix = Date.now();
    const rec1Email = `rec1_step9_${uniqueSuffix}@test.com`;
    const regRec1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/recruiter/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `Nexus Dynamics ${uniqueSuffix}`,
        email: rec1Email,
        password: 'Password123!',
        industry: 'Cloud Infrastructure',
        location: 'Seattle, WA'
      }
    });
    assert(regRec1.statusCode === 201, 'Recruiter 1 registered successfully');
    const rec1Token = regRec1.body.token;
    const company1Id = regRec1.body.company.id;

    // 2. Post Job for Company 1
    const jobRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/jobs',
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Cloud Systems Architect',
        description: 'Lead next-gen serverless microservices infrastructure.',
        location: 'Seattle, WA',
        type: 'Full-time',
        experienceLevel: 'Senior Level'
      }
    });
    assert(jobRes.statusCode === 201, 'Job posted successfully');
    const job = jobRes.body.job;

    // 3. Create Applicant
    const appEmail = `applicant_step9_${Date.now()}@test.com`;
    const regApp = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Grace Hopper',
        email: appEmail,
        password: 'Password123!',
        phone: '5551234567',
        location: 'Seattle, WA',
        skills: ['Kubernetes', 'Go', 'AWS']
      }
    });
    assert(regApp.statusCode === 201, 'Applicant registered successfully');
    const applicantToken = regApp.body.token;
    const applicantId = regApp.body.user.id;

    // Create a resume for Applicant
    const resume = await Resume.create({
      applicantId: applicantId,
      fileName: 'Grace_Hopper_Architect_CV.pdf',
      filePath: '/uploads/resumes/mock_resume_grace.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      isDefault: true
    });

    // 4. Create Recruiter 2 (for cross-company checks)
    const rec2Email = `rec2_step9_${Date.now()}_2@test.com`;
    const regRec2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/recruiter/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `Wayne Tech ${Date.now()}_2`,
        email: rec2Email,
        password: 'Password123!',
        industry: 'Defense',
        location: 'Gotham, NJ'
      }
    });
    const rec2Token = regRec2.body.token;

    // TEST 1: Fork Execution - Submit Application
    const submitRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicantToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        jobId: job._id,
        resumeId: resume._id,
        coverLetter: 'Architecting distributed systems for 10+ years.',
        notes: 'Notice period: 30 days.'
      }
    });

    assert(submitRes.statusCode === 201, 'Fork: Application stored in database with 201 Created');
    const application = submitRes.body.application;
    assert(application.status === 'Applied', 'Initial application status is "Applied"');

    // TEST 2: Fork Execution - Recruiter Notification Generated in MongoDB
    const notif = await Notification.findOne({
      recipientId: company1Id,
      applicationId: application._id
    });
    assert(notif !== null, 'Fork: Recruiter notification document persisted in MongoDB');
    assert(notif.title === 'New Application Received', 'Notification title is "New Application Received"');
    assert(notif.applicantName === 'Grace Hopper', 'Notification contains Applicant name');
    assert(notif.jobTitle === 'Cloud Systems Architect', 'Notification contains Job title');
    assert(notif.applicationDate !== undefined, 'Notification contains Application date');
    assert(notif.applicationStatus === 'Applied', 'Notification contains Application status');
    assert(notif.reviewLink && notif.reviewLink.includes(application._id), 'Notification contains Link to review application');
    assert(notif.isRead === false, 'Notification initial status is unread (isRead: false)');

    // TEST 3: Recruiter queries notifications via GET /api/notifications
    const getNotifsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(getNotifsRes.statusCode === 200, 'GET /api/notifications returns 200 OK');
    assert(getNotifsRes.body.unreadCount >= 1, 'Unread count reflects new application');
    assert(getNotifsRes.body.notifications[0].applicantName === 'Grace Hopper', 'Notification has candidate name in API response');

    // TEST 4: Recruiter marks notification as read via PATCH /api/notifications/:id/read
    const markReadRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/notifications/${notif._id}/read`,
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(markReadRes.statusCode === 200, 'PATCH /api/notifications/:id/read marks notification read');
    assert(markReadRes.body.notification.isRead === true, 'Notification isRead updated to true');

    // TEST 5: Recruiter views received applications via GET /api/applications/recruiter/company
    const companyAppsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications/recruiter/company',
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(companyAppsRes.statusCode === 200, 'GET /api/applications/recruiter/company returns 200 OK');
    assert(companyAppsRes.body.count === 1, 'Company applications list returns 1 received submission');
    assert(companyAppsRes.body.applications[0].applicantId.name === 'Grace Hopper', 'Applicant details populated');
    assert(companyAppsRes.body.applications[0].resumeId.fileName === 'Grace_Hopper_Architect_CV.pdf', 'Resume details populated');

    // TEST 6: Join Execution - Recruiter updates application status to "Shortlisted"
    const shortlistRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${application._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'Shortlisted',
        notes: 'Impressive architecture background. Move to round 1.'
      }
    });
    assert(shortlistRes.statusCode === 200, 'Join: Status updated to "Shortlisted" with 200 OK');
    assert(shortlistRes.body.application.status === 'Shortlisted', 'Status changed to Shortlisted');

    // Check applicant received status update notification
    const applicantNotif = await Notification.findOne({
      recipientId: applicantId,
      type: 'APPLICATION_STATUS_UPDATE'
    });
    assert(applicantNotif !== null, 'Applicant received status update notification in MongoDB');

    // TEST 7: Join Execution - Recruiter updates application status to "Hired"
    const hireRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${application._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'Hired',
        notes: 'Accepted senior architect offer!'
      }
    });
    assert(hireRes.statusCode === 200, 'Join: Status updated from Shortlisted to "Hired"');
    assert(hireRes.body.application.status === 'Hired', 'Status changed to Hired');

    // TEST 8: State Transition Enforcement - Invalid status transition
    // Cannot transition from Hired back to Applied
    const invalidRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${application._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Applied' }
    });
    assert(invalidRes.statusCode === 400, 'Invalid transition (Hired -> Applied) blocked with 400 Bad Request');

    // TEST 9: Recruiter 2 (different company) cannot update Recruiter 1's application
    const crossCompanyRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${application._id}/status`,
      headers: {
        Authorization: `Bearer ${rec2Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Rejected' }
    });
    assert(crossCompanyRes.statusCode === 403, 'Cross-company recruiter blocked with 403 Forbidden');

    console.log(`\n🎉 Results: ${testsPassed}/${totalTests} tests passed.`);
    if (testsPassed === totalTests) {
      console.log('✅ ALL STEP 9 APPLICATION PROCESSING TESTS PASSED!');
    } else {
      console.error('❌ Some tests failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test execution error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
}

runTests();
