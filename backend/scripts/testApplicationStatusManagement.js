const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const { Applicant, Company, JobPosting, Resume, Application, Notification } = require('../models');

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step11_2026';

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
  console.log('🧪 Starting Application Status Management Test Suite (Step 11)...\n');

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job_application_tracker');
    }

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`📡 Test server running on ${baseUrl}\n`);
        resolve();
      });
    });

    const timestamp = Date.now();

    // 1. Register Recruiter 1 (Company A)
    const rec1Email = `rec1_step11_${timestamp}@test.com`;
    const regRec1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/recruiter/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `Quantum Systems ${timestamp}`,
        email: rec1Email,
        password: 'Password123!',
        industry: 'Quantum Computing',
        location: 'Boulder, CO'
      }
    });
    assert(regRec1.statusCode === 201, 'Recruiter 1 registered successfully');
    const rec1Token = regRec1.body.token;
    const company1Id = regRec1.body.company.id;

    // 2. Register Recruiter 2 (Company B - for cross-company isolation)
    const rec2Email = `rec2_step11_${timestamp}@test.com`;
    const regRec2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/recruiter/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `Helios Dynamics ${timestamp}`,
        email: rec2Email,
        password: 'Password123!',
        industry: 'Solar Energy',
        location: 'Phoenix, AZ'
      }
    });
    assert(regRec2.statusCode === 201, 'Recruiter 2 registered successfully');
    const rec2Token = regRec2.body.token;

    // 3. Post Job for Company 1
    const jobRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/jobs',
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Quantum Algorithm Researcher',
        description: 'Design fault-tolerant quantum algorithms.',
        location: 'Boulder, CO',
        type: 'Full-time',
        experienceLevel: 'Lead / Executive'
      }
    });
    assert(jobRes.statusCode === 201, 'Job posted successfully for Company 1');
    const job = jobRes.body.job;

    // 4. Register Applicant 1
    const app1Email = `applicant1_step11_${timestamp}@test.com`;
    const regApp1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Richard Feynman',
        email: app1Email,
        password: 'Password123!',
        phone: '3035559876',
        location: 'Boulder, CO',
        skills: ['Quantum Mechanics', 'Qiskit', 'Linear Algebra']
      }
    });
    assert(regApp1.statusCode === 201, 'Applicant 1 registered successfully');
    const applicant1Token = regApp1.body.token;
    const applicant1Id = regApp1.body.user.id;

    // Create Resume for Applicant 1
    const resume1 = await Resume.create({
      applicantId: applicant1Id,
      fileName: 'Richard_Feynman_Quantum_CV.pdf',
      filePath: '/uploads/resumes/mock_feynman.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      isDefault: true
    });

    // 5. Register Applicant 2 (for separate application testing)
    const app2Email = `applicant2_step11_${timestamp}@test.com`;
    const regApp2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Niels Bohr',
        email: app2Email,
        password: 'Password123!',
        phone: '3035555432',
        location: 'Boulder, CO',
        skills: ['Quantum Physics', 'Atomic Models']
      }
    });
    assert(regApp2.statusCode === 201, 'Applicant 2 registered successfully');
    const applicant2Token = regApp2.body.token;
    const applicant2Id = regApp2.body.user.id;

    // Create Resume for Applicant 2
    const resume2 = await Resume.create({
      applicantId: applicant2Id,
      fileName: 'Niels_Bohr_Quantum_CV.pdf',
      filePath: '/uploads/resumes/mock_bohr.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      isDefault: true
    });

    // 6. Submit Application 1 (Richard Feynman)
    const submit1Res = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        jobId: job._id,
        resumeId: resume1._id,
        coverLetter: 'Passionate about quantum electrodynamics.',
        notes: 'Notice period: 15 days.'
      }
    });
    assert(submit1Res.statusCode === 201, 'Application 1 submitted successfully');
    const app1 = submit1Res.body.application;
    assert(app1.status === 'Applied', 'Initial default status is "Applied"');

    // 7. Submit Application 2 (Niels Bohr)
    const submit2Res = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant2Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        jobId: job._id,
        resumeId: resume2._id,
        coverLetter: 'Expert in quantum complementarities.',
        notes: 'Immediate start.'
      }
    });
    assert(submit2Res.statusCode === 201, 'Application 2 submitted successfully');
    const app2 = submit2Res.body.application;
    assert(app2.status === 'Applied', 'Initial default status for App 2 is "Applied"');

    // --- TEST 1: Role Security - Applicant Cannot Change Status ---
    const applicantForbiddenRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${applicant1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Shortlisted' }
    });
    assert(applicantForbiddenRes.statusCode === 403, 'Applicant attempting to update status is blocked with 403 Forbidden');

    // --- TEST 2: Role Security - Unauthenticated Request Rejected ---
    const unauthenticatedRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: { 'Content-Type': 'application/json' },
      body: { status: 'Shortlisted' }
    });
    assert(unauthenticatedRes.statusCode === 401, 'Unauthenticated status update returns 401 Unauthorized');

    // --- TEST 3: Cross-Company Security ---
    const crossCompanyRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec2Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Shortlisted' }
    });
    assert(crossCompanyRes.statusCode === 403, 'Cross-company recruiter is blocked with 403 Forbidden');

    // --- TEST 4: Validation - Arbitrary Status Values Rejected ---
    const arbitraryStatusRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'UnderReview' }
    });
    assert(arbitraryStatusRes.statusCode === 400, 'Arbitrary status ("UnderReview") rejected with 400 Bad Request');

    const pendingStatusRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Pending' }
    });
    assert(pendingStatusRes.statusCode === 400, 'Arbitrary status ("Pending") rejected with 400 Bad Request');

    const emptyStatusRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: '   ' }
    });
    assert(emptyStatusRes.statusCode === 400, 'Empty status rejected with 400 Bad Request');

    // --- TEST 5: State Machine - Invalid Transition Applied → Hired (skipping Shortlisted) ---
    const skipToHiredRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Hired' }
    });
    assert(skipToHiredRes.statusCode === 400, 'Invalid transition: Direct Applied → Hired blocked with 400 Bad Request');

    // --- TEST 6: Valid Action: Applied → Shortlisted ---
    const shortlistRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'Shortlisted',
        notes: 'Passed initial screening. Moving to technical round.'
      }
    });
    assert(shortlistRes.statusCode === 200, 'Recruiter action: Applied → Shortlisted returns 200 OK');
    assert(shortlistRes.body.application.status === 'Shortlisted', 'Application status updated to Shortlisted');

    // Check applicant received notification for Shortlisted
    const notifShortlist = await Notification.findOne({
      recipientId: applicant1Id,
      type: { $in: ['APPLICATION_STATUS_UPDATE', 'APPLICATION_SHORTLISTED'] },
      applicationStatus: 'Shortlisted'
    });
    assert(notifShortlist !== null, 'Applicant received status notification for Shortlisted');

    // --- TEST 7: State Machine - Invalid Transition Shortlisted → Applied (cannot move backwards) ---
    const backwardRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Applied' }
    });
    assert(backwardRes.statusCode === 400, 'Invalid transition: Shortlisted → Applied blocked with 400 Bad Request');

    // --- TEST 8: State Machine - Redundant Transition Shortlisted → Shortlisted ---
    const sameStatusRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Shortlisted' }
    });
    assert(sameStatusRes.statusCode === 400, 'Redundant transition: Shortlisted → Shortlisted blocked with 400 Bad Request');

    // --- TEST 9: Valid Action: Shortlisted → Hired ---
    const hireRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'Hired',
        notes: 'Offer letter signed. Welcome aboard!'
      }
    });
    assert(hireRes.statusCode === 200, 'Recruiter action: Shortlisted → Hired returns 200 OK');
    assert(hireRes.body.application.status === 'Hired', 'Application status updated to Hired');

    // Check applicant received notification for Hired
    const notifHired = await Notification.findOne({
      recipientId: applicant1Id,
      type: { $in: ['APPLICATION_STATUS_UPDATE', 'APPLICATION_HIRED'] },
      applicationStatus: 'Hired'
    });
    assert(notifHired !== null, 'Applicant received status notification for Hired');

    // --- TEST 10: State Machine - Terminal State Mutation from Hired blocked ---
    const hiredToRejectedRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Rejected' }
    });
    assert(hiredToRejectedRes.statusCode === 400, 'Terminal state: Hired → Rejected blocked with 400 Bad Request');

    const hiredToShortlistedRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app1._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Shortlisted' }
    });
    assert(hiredToShortlistedRes.statusCode === 400, 'Terminal state: Hired → Shortlisted blocked with 400 Bad Request');

    // --- TEST 11: Valid Action: Applied → Rejected (Direct Rejection on App 2) ---
    const rejectDirectRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app2._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'Rejected',
        notes: 'Position requirements filled.'
      }
    });
    assert(rejectDirectRes.statusCode === 200, 'Recruiter action: Applied → Rejected returns 200 OK');
    assert(rejectDirectRes.body.application.status === 'Rejected', 'Application 2 status updated to Rejected');

    // Check applicant received notification for Rejected
    const notifRejected = await Notification.findOne({
      recipientId: applicant2Id,
      type: { $in: ['APPLICATION_STATUS_UPDATE', 'APPLICATION_REJECTED'] },
      applicationStatus: 'Rejected'
    });
    assert(notifRejected !== null, 'Applicant received status notification for Rejected');

    // --- TEST 12: State Machine - Terminal State Mutation from Rejected blocked ---
    const rejectedToShortlistedRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app2._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Shortlisted' }
    });
    assert(rejectedToShortlistedRes.statusCode === 400, 'Terminal state: Rejected → Shortlisted blocked with 400 Bad Request');

    const rejectedToHiredRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app2._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Hired' }
    });
    assert(rejectedToHiredRes.statusCode === 400, 'Terminal state: Rejected → Hired blocked with 400 Bad Request');

    // --- TEST 13: Valid Action: Shortlisted → Rejected ---
    // Submit Application 3 to test Shortlisted → Rejected
    const app3Email = `applicant3_step11_${timestamp}@test.com`;
    const regApp3 = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Max Planck',
        email: app3Email,
        password: 'Password123!',
        phone: '3035551111',
        location: 'Boulder, CO',
        skills: ['Blackbody Radiation', 'Quantum Constant']
      }
    });
    const applicant3Token = regApp3.body.token;
    const applicant3Id = regApp3.body.user.id;

    const resume3 = await Resume.create({
      applicantId: applicant3Id,
      fileName: 'Max_Planck_CV.pdf',
      filePath: '/uploads/resumes/mock_planck.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      isDefault: true
    });

    const submit3Res = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicant3Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        jobId: job._id,
        resumeId: resume3._id,
        coverLetter: 'Introduced the quantum of action.'
      }
    });
    const app3 = submit3Res.body.application;

    // Shortlist first
    await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app3._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: { status: 'Shortlisted' }
    });

    // Now Reject from Shortlisted
    const rejectFromShortlistRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/applications/${app3._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'Rejected',
        notes: 'Passed interview round 1 but selected another finalist.'
      }
    });
    assert(rejectFromShortlistRes.statusCode === 200, 'Recruiter action: Shortlisted → Rejected returns 200 OK');
    assert(rejectFromShortlistRes.body.application.status === 'Rejected', 'Application 3 status updated from Shortlisted to Rejected');

    console.log(`\n🎉 Results: ${testsPassed}/${totalTests} tests passed.`);
    if (testsPassed === totalTests) {
      console.log('✅ ALL STEP 11 APPLICATION STATUS MANAGEMENT TESTS PASSED!');
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
