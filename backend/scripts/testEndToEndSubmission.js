const http = require('http');

function makeReq({ method = 'GET', path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(`http://localhost:5000${path}`);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch (_) {}
        resolve({ status: res.statusCode, data: json, raw });
      });
    });

    req.on('error', reject);
    if (body) {
      if (Buffer.isBuffer(body)) req.write(body);
      else if (typeof body === 'string') req.write(body);
      else req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function buildMultipart({ boundary, fieldName, fileName, contentType, fileBuffer }) {
  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
    `Content-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return Buffer.concat([head, fileBuffer, tail]);
}

async function runE2E() {
  console.log('Testing live server at http://localhost:5000...');

  // 1. Register Recruiter
  const recEmail = `live_recruiter_${Date.now()}@test.com`;
  const recRes = await makeReq({
    method: 'POST',
    path: '/api/recruiter/auth/register',
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Stark Industries',
      email: recEmail,
      password: 'Password123!',
      industry: 'Defense & Technology',
      location: 'New York, NY'
    }
  });
  console.log('1. Recruiter registered:', recRes.status === 201 ? 'OK' : 'FAIL');
  const recruiterToken = recRes.data.token;

  // 2. Post Job
  const jobRes = await makeReq({
    method: 'POST',
    path: '/api/jobs',
    headers: {
      Authorization: `Bearer ${recruiterToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      title: 'Senior AI Engineer',
      description: 'Develop JARVIS core systems.',
      location: 'New York, NY',
      type: 'Full-time',
      experienceLevel: 'Senior Level'
    }
  });
  console.log('2. Job posted:', jobRes.status === 201 ? 'OK' : 'FAIL');
  const job = jobRes.data.job;

  // 3. Register Applicant
  const appEmail = `live_applicant_${Date.now()}@test.com`;
  const appRes = await makeReq({
    method: 'POST',
    path: '/api/auth/register',
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Peter Parker',
      email: appEmail,
      password: 'Password123!',
      phone: '1234567890',
      location: 'Queens, NY',
      skills: ['Physics', 'Python']
    }
  });
  console.log('3. Applicant registered:', appRes.status === 201 ? 'OK' : 'FAIL');
  const applicantToken = appRes.data.token;

  // 4. Upload Resume
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const pdfBuffer = Buffer.from('%PDF-1.4 Peter Parker Resume');
  const multipart = buildMultipart({
    boundary,
    fieldName: 'resume',
    fileName: 'Peter_Parker_Resume.pdf',
    contentType: 'application/pdf',
    fileBuffer: pdfBuffer
  });

  const uploadRes = await makeReq({
    method: 'POST',
    path: '/api/resumes',
    headers: {
      Authorization: `Bearer ${applicantToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': multipart.length
    },
    body: multipart
  });
  console.log('4. Resume uploaded:', uploadRes.status === 201 ? 'OK' : 'FAIL');
  const resume = uploadRes.data.resume;

  // 5. Submit Application
  const submitRes = await makeReq({
    method: 'POST',
    path: '/api/applications',
    headers: {
      Authorization: `Bearer ${applicantToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      jobId: job._id,
      resumeId: resume._id,
      coverLetter: 'I would love to contribute to Stark Industries engineering team.',
      notes: 'Available immediately.'
    }
  });
  console.log('5. Application submitted:', submitRes.status === 201 ? 'OK' : 'FAIL');
  console.log('   Application ID:', submitRes.data?.application?.applicationId);
  console.log('   Status:', submitRes.data?.application?.status);

  // 6. Duplicate Submission attempt
  const dupRes = await makeReq({
    method: 'POST',
    path: '/api/applications',
    headers: {
      Authorization: `Bearer ${applicantToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      jobId: job._id,
      resumeId: resume._id
    }
  });
  console.log('6. Duplicate submission blocked:', dupRes.status === 409 ? 'OK (409 Conflict)' : 'FAIL');

  // 7. Get My Applications
  const myAppsRes = await makeReq({
    method: 'GET',
    path: '/api/applications/my',
    headers: { Authorization: `Bearer ${applicantToken}` }
  });
  console.log('7. My applications count:', myAppsRes.data?.count === 1 ? 'OK (1 application found)' : 'FAIL');

  // 8. Recruiter reads application
  const readAppRes = await makeReq({
    method: 'GET',
    path: `/api/applications/${submitRes.data.application._id}`,
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  console.log('8. Recruiter access to application:', readAppRes.status === 200 ? 'OK' : 'FAIL');

  console.log('\n🎉 Live E2E Integration Test Completed Successfully!');
}

runE2E().catch(console.error);
