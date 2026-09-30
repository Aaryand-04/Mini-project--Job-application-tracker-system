const http = require('http');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/db');
const { Applicant, Company, Resume } = require('../models');
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
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function buildMultipartFormData({ boundary, fieldName, fileName, contentType, fileBuffer }) {
  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
    `Content-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return Buffer.concat([head, fileBuffer, tail]);
}

async function runTests() {
  console.log('🧪 Starting Resume Management Test Suite (Step 7)...\n');
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

    // 1. Create Applicant 1
    const app1Email = `applicant1_${Date.now()}@test.com`;
    const regRes1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Sarah Connor',
        email: app1Email,
        password: 'Password123!',
        phone: '1234567890',
        location: 'San Francisco, CA',
        skills: ['React', 'Node.js']
      }
    });
    assert(regRes1.statusCode === 201, 'Applicant 1 registered successfully');
    const token1 = regRes1.body.token;
    const applicant1Id = regRes1.body.user.id;

    // 2. Create Applicant 2 (for cross-user ownership tests)
    const app2Email = `applicant2_${Date.now()}@test.com`;
    const regRes2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'John Connor',
        email: app2Email,
        password: 'Password123!',
        phone: '9876543210',
        location: 'Los Angeles, CA',
        skills: ['Python']
      }
    });
    const token2 = regRes2.body.token;

    // 3. Create Recruiter (for RBAC test)
    const recEmail = `recruiter_${Date.now()}@test.com`;
    const regRec = await makeRequest({
      method: 'POST',
      urlPath: '/api/recruiter/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Tech Corp',
        email: recEmail,
        password: 'Password123!',
        industry: 'Software',
        location: 'San Francisco, CA'
      }
    });
    const recruiterToken = regRec.body.token;

    // TEST 1: Unauthenticated request to /api/resumes
    const unauthRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/resumes'
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated access to /api/resumes returns 401 Unauthorized');

    // TEST 2: Recruiter cannot access /api/resumes
    const recRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/resumes',
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert(recRes.statusCode === 403, 'Recruiter access to /api/resumes is blocked with 403 Forbidden');

    // TEST 3: Upload valid PDF resume
    const pdfBuffer = Buffer.from('%PDF-1.4 Mock PDF resume content for Sarah Connor');
    const boundary1 = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const pdfMultipart = buildMultipartFormData({
      boundary: boundary1,
      fieldName: 'resume',
      fileName: 'Sarah_Connor_Resume.pdf',
      contentType: 'application/pdf',
      fileBuffer: pdfBuffer
    });

    const uploadPdfRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/resumes',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': `multipart/form-data; boundary=${boundary1}`,
        'Content-Length': pdfMultipart.length
      },
      body: pdfMultipart
    });

    assert(uploadPdfRes.statusCode === 201, 'POST /api/resumes uploads PDF successfully with 201 Created');
    const resume1 = uploadPdfRes.body.resume;
    assert(resume1 && resume1.resumeId && resume1.resumeId.startsWith('RES-'), 'Resume has conceptual resumeId (RES-XXXXXX)');
    assert(resume1.fileName === 'Sarah_Connor_Resume.pdf', 'Resume has original fileName preserved');
    assert(resume1.isDefault === true, 'First uploaded resume automatically set as default');
    
    // CRITICAL REQUIREMENT: Do not expose arbitrary filesystem paths to users
    const hasRawFsPath = resume1.filePath && (resume1.filePath.includes(':\\') || resume1.filePath.startsWith('/Users') || resume1.filePath.startsWith('/home') || resume1.filePath.includes('backend/uploads'));
    assert(!hasRawFsPath, 'Response does NOT expose raw server filesystem path to user');
    assert(resume1.fileUrl && resume1.fileUrl.startsWith('/api/resumes/'), 'Safe virtual fileUrl is provided (/api/resumes/:id)');

    // TEST 4: Upload valid DOCX resume
    const docxBuffer = Buffer.from('Mock DOCX resume file content for testing');
    const boundary2 = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const docxMultipart = buildMultipartFormData({
      boundary: boundary2,
      fieldName: 'resume',
      fileName: 'Sarah_Connor_Portfolio.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileBuffer: docxBuffer
    });

    const uploadDocxRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/resumes',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': `multipart/form-data; boundary=${boundary2}`,
        'Content-Length': docxMultipart.length
      },
      body: docxMultipart
    });

    assert(uploadDocxRes.statusCode === 201, 'POST /api/resumes uploads DOCX file with 201 Created');
    const resume2 = uploadDocxRes.body.resume;
    assert(resume2.isDefault === false, 'Second resume is not default by default');

    // TEST 5: Reject invalid file type (.exe or .txt)
    const badBuffer = Buffer.from('malicious executable binary or script');
    const boundaryBad = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const badMultipart = buildMultipartFormData({
      boundary: boundaryBad,
      fieldName: 'resume',
      fileName: 'virus.exe',
      contentType: 'application/x-msdownload',
      fileBuffer: badBuffer
    });

    const uploadBadRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/resumes',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': `multipart/form-data; boundary=${boundaryBad}`,
        'Content-Length': badMultipart.length
      },
      body: badMultipart
    });
    assert(uploadBadRes.statusCode === 400, 'POST /api/resumes rejects non-PDF/DOC/DOCX files with 400 Bad Request');
    assert(uploadBadRes.body.message.includes('Only PDF, DOC, and DOCX files are allowed'), 'Returns clear validation error for invalid file types');

    // TEST 6: Reject oversized file (> 5MB)
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024); // 5.5MB
    const boundaryLarge = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const largeMultipart = buildMultipartFormData({
      boundary: boundaryLarge,
      fieldName: 'resume',
      fileName: 'huge_resume.pdf',
      contentType: 'application/pdf',
      fileBuffer: largeBuffer
    });

    const uploadLargeRes = await makeRequest({
      method: 'POST',
      urlPath: '/api/resumes',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': `multipart/form-data; boundary=${boundaryLarge}`,
        'Content-Length': largeMultipart.length
      },
      body: largeMultipart
    });
    assert(uploadLargeRes.statusCode === 400, 'POST /api/resumes rejects file exceeding 5MB with 400 Bad Request');

    // TEST 7: GET /api/resumes
    const getResumesRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/resumes',
      headers: {
        Authorization: `Bearer ${token1}`,
        Accept: 'application/json'
      }
    });
    assert(getResumesRes.statusCode === 200, 'GET /api/resumes returns 200 OK');
    assert(getResumesRes.body.count === 2, 'GET /api/resumes returns correct count of 2 resumes');
    assert(getResumesRes.body.resumes[0].isDefault === true, 'Default resume is prioritized');

    // TEST 8: GET /api/resumes/:id (Metadata JSON)
    const getSingleRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/resumes/${resume1._id}?format=json`,
      headers: {
        Authorization: `Bearer ${token1}`,
        Accept: 'application/json'
      }
    });
    assert(getSingleRes.statusCode === 200, 'GET /api/resumes/:id returns resume metadata');
    assert(getSingleRes.body.resume.fileName === 'Sarah_Connor_Resume.pdf', 'Metadata has correct fileName');

    // TEST 9: GET /api/resumes/:id?download=true (Binary stream)
    const downloadRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/resumes/${resume1._id}?download=true`,
      headers: {
        Authorization: `Bearer ${token1}`
      }
    });
    assert(downloadRes.statusCode === 200, 'GET /api/resumes/:id?download=true streams file');
    assert(downloadRes.rawBody.toString().includes('Mock PDF resume content'), 'Downloaded content matches original file content');

    // TEST 10: Strict Ownership Enforcement (Applicant 2 accessing Applicant 1's resume)
    const crossAccessRes = await makeRequest({
      method: 'GET',
      urlPath: `/api/resumes/${resume1._id}`,
      headers: {
        Authorization: `Bearer ${token2}`
      }
    });
    assert(crossAccessRes.statusCode === 403, 'Cross-user access returns 403 Forbidden (Applicant 2 cannot access Applicant 1 resume)');

    const crossDeleteRes = await makeRequest({
      method: 'DELETE',
      urlPath: `/api/resumes/${resume1._id}`,
      headers: {
        Authorization: `Bearer ${token2}`
      }
    });
    assert(crossDeleteRes.statusCode === 403, 'Cross-user deletion returns 403 Forbidden (Applicant 2 cannot delete Applicant 1 resume)');

    // TEST 11: PATCH /api/resumes/:id/select (Select resume when applying)
    const selectRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/resumes/${resume2._id}/select`,
      headers: {
        Authorization: `Bearer ${token1}`,
        Accept: 'application/json'
      }
    });
    assert(selectRes.statusCode === 200, 'PATCH /api/resumes/:id/select selects resume as primary');
    assert(selectRes.body.resume.isDefault === true, 'Updated resume isDefault is true');

    // TEST 12: DELETE /api/resumes/:id (Delete resume & file on disk)
    // Find internal file path before deletion to verify disk cleanup
    const rawDoc = await Resume.findById(resume1._id);
    const diskPath = path.resolve(rawDoc.filePath);
    assert(fs.existsSync(diskPath), 'Resume file exists on server disk prior to deletion');

    const deleteRes = await makeRequest({
      method: 'DELETE',
      urlPath: `/api/resumes/${resume1._id}`,
      headers: {
        Authorization: `Bearer ${token1}`
      }
    });
    assert(deleteRes.statusCode === 200, 'DELETE /api/resumes/:id returns 200 OK');
    assert(!fs.existsSync(diskPath), 'Physical file is removed from disk after resume deletion');

    const dbCheck = await Resume.findById(resume1._id);
    assert(dbCheck === null, 'Resume record is removed from MongoDB');

    console.log(`\n🎉 Results: ${testsPassed}/${totalTests} tests passed.`);
    if (testsPassed === totalTests) {
      console.log('✅ ALL STEP 7 RESUME MANAGEMENT TESTS PASSED!');
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
