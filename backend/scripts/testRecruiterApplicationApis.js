const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const { Applicant, Company, JobPosting, Resume, Application, Notification } = require('../models');

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step10_2026';

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
  console.log('🧪 Starting Recruiter Application Management Test Suite (Step 10)...\n');

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

    // 1. Create Recruiter 1 (Company A)
    const rec1Email = `rec1_step10_${timestamp}@test.com`;
    const regRec1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/recruiter/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `Horizon Aerospace ${timestamp}`,
        email: rec1Email,
        password: 'Password123!',
        industry: 'Aerospace Engineering',
        location: 'Denver, CO'
      }
    });
    assert(regRec1.statusCode === 201, 'Recruiter 1 registered successfully');
    const rec1Token = regRec1.body.token;
    const company1Id = regRec1.body.company.id;

    // 2. Create Recruiter 2 (Company B - for cross-company isolation tests)
    const rec2Email = `rec2_step10_${timestamp}@test.com`;
    const regRec2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/recruiter/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `Cyberdyne Systems ${timestamp}`,
        email: rec2Email,
        password: 'Password123!',
        industry: 'Robotics',
        location: 'Sunnyvale, CA'
      }
    });
    assert(regRec2.statusCode === 201, 'Recruiter 2 registered successfully');
    const rec2Token = regRec2.body.token;
    const company2Id = regRec2.body.company.id;

    // 3. Post Job for Company 1
    const job1Res = await makeRequest({
      method: 'POST',
      urlPath: '/api/jobs',
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Propulsion Systems Engineer',
        description: 'Design and validate cryogenic rocket propulsion stages.',
        location: 'Denver, CO',
        type: 'Full-time',
        experienceLevel: 'Senior Level'
      }
    });
    assert(job1Res.statusCode === 201, 'Job 1 posted successfully for Company 1');
    const job1 = job1Res.body.job;

    // 4. Post Job for Company 2
    const job2Res = await makeRequest({
      method: 'POST',
      urlPath: '/api/jobs',
      headers: {
        Authorization: `Bearer ${rec2Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Neural Network Specialist',
        description: 'Build neural autonomy software.',
        location: 'Sunnyvale, CA',
        type: 'Full-time',
        experienceLevel: 'Mid Level'
      }
    });
    assert(job2Res.statusCode === 201, 'Job 2 posted successfully for Company 2');
    const job2 = job2Res.body.job;

    // 5. Create Applicant
    const appEmail = `applicant_step10_${timestamp}@test.com`;
    const regApp = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Alan Turing',
        email: appEmail,
        password: 'Password123!',
        phone: '3035551234',
        location: 'Denver, CO',
        skills: ['Cryogenics', 'Thermodynamics', 'Simulink', 'MATLAB']
      }
    });
    assert(regApp.statusCode === 201, 'Applicant registered successfully');
    const applicantToken = regApp.body.token;
    const applicantId = regApp.body.user.id;

    // Create a real mock resume file on disk
    const uploadsDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const mockFilePath = path.join(uploadsDir, `test_resume_step10_${timestamp}.pdf`);
    fs.writeFileSync(mockFilePath, '%PDF-1.4 Mock resume content for Alan Turing');

    const resume = await Resume.create({
      applicantId: applicantId,
      fileName: 'Alan_Turing_Propulsion_CV.pdf',
      filePath: mockFilePath,
      fileSize: 42,
      mimeType: 'application/pdf',
      isDefault: true
    });
    assert(resume !== null, 'Mock resume record created on disk and in DB');

    // 6. Submit Application to Job 1 (Company 1)
    const submitRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        Authorization: `Bearer ${applicantToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        jobId: job1._id,
        resumeId: resume._id,
        coverLetter: 'Passionate about orbital mechanics and regenerative cooling.',
        notes: 'Available for immediate interview.'
      }
    });
    assert(submitRes.statusCode === 201, 'Application submitted to Job 1');
    const application = submitRes.body.application;

    // --- TEST 1: Authentication & Role Gate ---
    const unauthRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications'
    });
    assert(unauthRes.statusCode === 401, 'GET /api/recruiter/applications unauthenticated returns 401');

    const applicantForbiddenRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications',
      headers: { Authorization: `Bearer ${applicantToken}` }
    });
    assert(applicantForbiddenRes.statusCode === 403, 'GET /api/recruiter/applications by applicant returns 403 Forbidden');

    // --- TEST 2: Recruiter 1 retrieves applications for their company ---
    const rec1AppsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications',
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(rec1AppsRes.statusCode === 200, 'GET /api/recruiter/applications returns 200 OK');
    assert(rec1AppsRes.body.count === 1, 'Recruiter 1 sees 1 application');
    const receivedApp = rec1AppsRes.body.applications[0];
    assert(receivedApp.applicantId.name === 'Alan Turing', 'Display: Applicant name populated');
    assert(receivedApp.applicantId.email === appEmail, 'Display: Applicant email populated');
    assert(receivedApp.jobId.title === 'Propulsion Systems Engineer', 'Display: Job title populated');
    assert(receivedApp.appliedDate !== undefined, 'Display: Applied date populated');
    assert(receivedApp.resumeId.fileName === 'Alan_Turing_Propulsion_CV.pdf', 'Display: Resume populated');
    assert(receivedApp.coverLetter === 'Passionate about orbital mechanics and regenerative cooling.', 'Display: Cover letter populated');
    assert(receivedApp.notes === 'Available for immediate interview.', 'Display: Notes populated');
    assert(receivedApp.status === 'Applied', 'Display: Current status populated');

    // --- TEST 3: Cross-Company Isolation in Applications List ---
    const rec2AppsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications',
      headers: { Authorization: `Bearer ${rec2Token}` }
    });
    assert(rec2AppsRes.statusCode === 200, 'Recruiter 2 lists applications with 200 OK');
    assert(rec2AppsRes.body.count === 0, 'Cross-company: Recruiter 2 sees 0 applications');

    // --- TEST 4: Query Filtering (Status and Search) ---
    const searchMatchRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications?search=Turing',
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(searchMatchRes.body.count === 1, 'Search by candidate name "Turing" finds 1 application');

    const searchNoMatchRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications?search=NonExistentCandidate',
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(searchNoMatchRes.body.count === 0, 'Search with unmatched query returns 0 applications');

    const statusMatchRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications?status=Applied',
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(statusMatchRes.body.count === 1, 'Filter by status "Applied" returns 1 application');

    const statusNoMatchRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/recruiter/applications?status=Hired',
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(statusNoMatchRes.body.count === 0, 'Filter by status "Hired" returns 0 applications');

    // --- TEST 5: GET /api/recruiter/applications/:id ---
    const getSingleAppRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/recruiter/applications/${application._id}`,
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(getSingleAppRes.statusCode === 200, 'GET /api/recruiter/applications/:id returns 200 OK');
    assert(getSingleAppRes.body.application.applicantId.name === 'Alan Turing', 'Single app details contains applicant name');
    assert(getSingleAppRes.body.application.applicantId.email === appEmail, 'Single app details contains applicant email');
    assert(getSingleAppRes.body.application.jobId.title === 'Propulsion Systems Engineer', 'Single app details contains job title');
    assert(getSingleAppRes.body.application.resumeId.fileName === 'Alan_Turing_Propulsion_CV.pdf', 'Single app details contains resume');

    // Conceptual ID lookup
    const getByConceptualIdRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/recruiter/applications/${application.applicationId}`,
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(getByConceptualIdRes.statusCode === 200, 'GET /api/recruiter/applications/:id by conceptual applicationId returns 200 OK');

    // --- TEST 6: Cross-Company Access Prevention (Security Requirement) ---
    const unauthorizedCompanyAppRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/recruiter/applications/${application._id}`,
      headers: { Authorization: `Bearer ${rec2Token}` }
    });
    assert(unauthorizedCompanyAppRes.statusCode === 403, 'Cross-company recruiter blocked with 403 Forbidden on single application');

    // --- TEST 7: Secure Resume Access via /api/recruiter/applications/:id/resume ---
    const resumeStreamRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/recruiter/applications/${application._id}/resume?download=true`,
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(resumeStreamRes.statusCode === 200, 'Secure resume download returns 200 OK');
    assert(resumeStreamRes.headers['content-disposition'].includes('Alan_Turing_Propulsion_CV.pdf'), 'Content-Disposition includes file name');

    const unauthorizedResumeRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/recruiter/applications/${application._id}/resume`,
      headers: { Authorization: `Bearer ${rec2Token}` }
    });
    assert(unauthorizedResumeRes.statusCode === 403, 'Cross-company recruiter blocked with 403 Forbidden on resume download');

    // --- TEST 8: Secure Resume Access via /api/resumes/:id ---
    const directResumeRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/resumes/${resume._id}?download=true`,
      headers: { Authorization: `Bearer ${rec1Token}` }
    });
    assert(directResumeRes.statusCode === 200, 'Recruiter 1 can access candidate resume via /api/resumes/:id');

    const directResumeForbiddenRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/resumes/${resume._id}?download=true`,
      headers: { Authorization: `Bearer ${rec2Token}` }
    });
    assert(directResumeForbiddenRes.statusCode === 403, 'Recruiter 2 blocked with 403 Forbidden from /api/resumes/:id');

    // --- TEST 9: Recruiter updates application status ---
    const updateStatusRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${application._id}/status`,
      headers: {
        Authorization: `Bearer ${rec1Token}`,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'Shortlisted',
        notes: 'Outstanding technical profile. Scheduled technical interview.'
      }
    });
    assert(updateStatusRes.statusCode === 200, 'PATCH /api/recruiter/applications/:id/status updates status to Shortlisted');
    assert(updateStatusRes.body.application.status === 'Shortlisted', 'Status changed to Shortlisted');

    // Check applicant received notification
    const applicantNotif = await Notification.findOne({
      recipientId: applicantId,
      type: { $in: ['APPLICATION_STATUS_UPDATE', 'APPLICATION_SHORTLISTED'] }
    });
    assert(applicantNotif !== null, 'Applicant received status update notification in MongoDB');

    // Clean up temporary mock file
    if (fs.existsSync(mockFilePath)) {
      try {
        fs.unlinkSync(mockFilePath);
      } catch (_) {}
    }

    console.log(`\n🎉 Results: ${testsPassed}/${totalTests} tests passed.`);
    if (testsPassed === totalTests) {
      console.log('✅ ALL STEP 10 RECRUITER APPLICATION MANAGEMENT TESTS PASSED!');
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
