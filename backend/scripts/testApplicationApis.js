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
  console.log('🧪 Starting Job Application Submission Test Suite (Step 8)...\n');
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

    // 1. Create Recruiter and Company
    const recEmail = `recruiter_step8_${Date.now()}@test.com`;
    const regRec = await makeRequest({
      method: 'POST',
      urlPath: '/api/recruiter/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `Cyberdyne Systems ${Date.now()}`,
        email: recEmail,
        password: 'Password123!',
        industry: 'Robotics & AI',
        location: 'Sunnyvale, CA',
        website: 'https://cyberdyne.example.com'
      }
    });
    assert(regRec.statusCode === 201, 'Recruiter registered successfully');
    const recruiterToken = regRec.body.token;
    const companyId = regRec.body.company.id;

    // 2. Create Active Job
    const activeJobRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/jobs',
      headers: {
        Authorization: `Bearer ${recruiterToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Full Stack Engineer',
        description: 'Design and build resilient full-stack systems with React and Node.js.',
        location: 'Sunnyvale, CA',
        type: 'Full-time',
        experienceLevel: 'Mid Level'
      }
    });
    assert(activeJobRes.statusCode === 201, 'Active job created successfully');
    const activeJob = activeJobRes.body.job;

    // 3. Create Inactive / Closed Job
    const closedJobRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/jobs',
      headers: {
        Authorization: `Bearer ${recruiterToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Legacy Cobol Developer',
        description: 'Maintain mainframe systems.',
        location: 'Remote',
        type: 'Contract',
        experienceLevel: 'Senior Level'
      }
    });
    const closedJob = closedJobRes.body.job;
    // Close the job
    await makeRequest({
      method: 'PATCH',
      urlPath: `/api/jobs/${closedJob._id}/close`,
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });

    // 4. Create Applicant 1
    const app1Email = `applicant1_step8_${Date.now()}@test.com`;
    const regApp1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Sarah Connor',
        email: app1Email,
        password: 'Password123!',
        phone: '1234567890',
        location: 'Los Angeles, CA',
        skills: ['React', 'Node.js']
      }
    });
    assert(regApp1.statusCode === 201, 'Applicant 1 registered successfully');
    const applicant1Token = regApp1.body.token;
    const applicant1Id = regApp1.body.user.id;

    // Create a resume for Applicant 1 directly via model
    const resume1 = await Resume.create({
      applicantId: applicant1Id,
      fileName: 'Sarah_Connor_Senior_Resume.pdf',
      filePath: '/uploads/resumes/mock_resume_1.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      isDefault: true
    });

    // 5. Create Applicant 2 (for cross-user checks)
    const app2Email = `applicant2_step8_${Date.now()}@test.com`;
    const regApp2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Kyle Reese',
        email: app2Email,
        password: 'Password123!',
        phone: '9876543210',
        location: 'Tech City, NV',
        skills: ['Security']
      }
    });
    const applicant2Token = regApp2.body.token;
    const applicant2Id = regApp2.body.user.id;

    // Create a resume for Applicant 2
    const resume2 = await Resume.create({
      applicantId: applicant2Id,
      fileName: 'Kyle_Reese_Resume.pdf',
      filePath: '/uploads/resumes/mock_resume_2.pdf',
      fileSize: 524288,
      mimeType: 'application/pdf',
      isDefault: true
    });

    // TEST 1: Unauthenticated request to POST /api/applications
    const unauthRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: { 'Content-Type': 'application/json' },
      body: { jobId: activeJob._id, resumeId: resume1._id }
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated POST /api/applications returns 401 Unauthorized');

    // TEST 2: Recruiter cannot submit applications
    const recSubmitRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${recruiterToken}`,
        'Content-Type': 'application/json'
      },
      body: { jobId: activeJob._id, resumeId: resume1._id }
    });
    assert(recSubmitRes.statusCode === 403, 'Recruiter account cannot submit applications (403 Forbidden)');

    // TEST 3: Missing required fields
    const missingRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant1Token}`,
        'Content-Type': 'application/json'
      },
      body: { jobId: activeJob._id } // missing resumeId
    });
    assert(missingRes.statusCode === 400, 'Missing resumeId returns 400 Bad Request');

    // TEST 4: Non-existent job
    const fakeJobId = '507f1f77bcf86cd799439011';
    const fakeJobRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant1Token}`,
        'Content-Type': 'application/json'
      },
      body: { jobId: fakeJobId, resumeId: resume1._id }
    });
    assert(fakeJobRes.statusCode === 404, 'Non-existent jobId returns 404 Not Found');

    // TEST 5: Inactive / Closed Job
    const closedSubmitRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant1Token}`,
        'Content-Type': 'application/json'
      },
      body: { jobId: closedJob._id, resumeId: resume1._id }
    });
    assert(closedSubmitRes.statusCode === 400, 'Applying to inactive/closed job returns 400 Bad Request');
    assert(closedSubmitRes.body.message.includes('inactive or closed'), 'Returns clear message about inactive job');

    // TEST 6: Applicant 1 trying to use Applicant 2's resume
    const stolenResumeRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant1Token}`,
        'Content-Type': 'application/json'
      },
      body: { jobId: activeJob._id, resumeId: resume2._id }
    });
    assert(stolenResumeRes.statusCode === 403, 'Using an unowned resume returns 403 Forbidden');

    // TEST 7: Valid Application Submission
    const validSubmitRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        jobId: activeJob._id,
        resumeId: resume1._id,
        coverLetter: 'I have 5+ years of experience in React and Node.js.',
        notes: 'Available to start immediately.'
      }
    });

    assert(validSubmitRes.statusCode === 201, 'Valid application submitted with 201 Created');
    const createdApp = validSubmitRes.body.application;
    assert(createdApp && createdApp.applicationId && createdApp.applicationId.startsWith('APP-'), 'Application has conceptual ID (APP-XXXXXX)');
    assert(createdApp.status === 'Applied', 'Initial status is "Applied"');
    assert(createdApp.coverLetter === 'I have 5+ years of experience in React and Node.js.', 'Cover letter stored correctly');
    assert(createdApp.notes === 'Available to start immediately.', 'Notes stored correctly');
    assert(createdApp.appliedDate !== undefined, 'appliedDate timestamp is set');

    // TEST 8: Recruiter received in-app Notification
    const notif = await Notification.findOne({
      recipientId: companyId,
      applicationId: createdApp._id
    });
    assert(notif !== null, 'Recruiter notification created in database');
    assert(notif.type === 'NEW_APPLICATION', 'Notification type is NEW_APPLICATION');
    assert(notif.title === 'New Application Received' || notif.jobTitle === activeJob.title, 'Notification references job or new application received');

    // TEST 9: Prevent Duplicate Application
    const duplicateRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        jobId: activeJob._id,
        resumeId: resume1._id,
        coverLetter: 'Second attempt'
      }
    });
    assert(duplicateRes.statusCode === 409, 'Duplicate application attempt returns 409 Conflict');
    assert(duplicateRes.body.message.includes('already submitted an application'), 'Clear error message on duplicate application');

    // TEST 10: GET /api/applications/my
    const myAppsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/applications/my',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(myAppsRes.statusCode === 200, 'GET /api/applications/my returns 200 OK');
    assert(myAppsRes.body.count === 1, 'Returns 1 application for Applicant 1');
    assert(myAppsRes.body.applications[0].jobId.title === 'Full Stack Engineer', 'Job title populated in my applications');
    assert(myAppsRes.body.applications[0].resumeId.fileName === 'Sarah_Connor_Senior_Resume.pdf', 'Resume populated in my applications');

    // TEST 11: GET /api/applications/:id by Applicant owner
    const getSingleOwnerRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/applications/${createdApp._id}`,
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(getSingleOwnerRes.statusCode === 200, 'Applicant owner can view application details via GET /api/applications/:id');

    // TEST 12: GET /api/applications/:id by Company Recruiter
    const getSingleRecruiterRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/applications/${createdApp._id}`,
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert(getSingleRecruiterRes.statusCode === 200, 'Hiring recruiter can view application details via GET /api/applications/:id');

    // TEST 13: GET /api/applications/:id by unauthorized user (Applicant 2)
    const unauthorizedGetRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/applications/${createdApp._id}`,
      headers: { Authorization: `Bearer ${applicant2Token}` }
    });
    assert(unauthorizedGetRes.statusCode === 403, 'Unauthorized applicant cannot view another applicant’s application (403 Forbidden)');

    console.log(`\n🎉 Results: ${testsPassed}/${totalTests} tests passed.`);
    if (testsPassed === totalTests) {
      console.log('✅ ALL STEP 8 APPLICATION SUBMISSION TESTS PASSED!');
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
