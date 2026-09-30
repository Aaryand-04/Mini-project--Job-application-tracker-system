const baseUrl = 'http://localhost:5000';

async function testRecruiterAuth() {
  console.log('====================================================');
  console.log('🏢 STEP 4: Recruiter Authentication & RBAC Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function request(url, options = {}) {
    const res = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Register Recruiter / Company
  console.log('1. Testing Recruiter Account Registration:');
  const uniqueEmail = `recruiter.${Date.now()}@techcorp.com`;
  const uniqueCompanyName = `TechCorp Global ${Date.now()}`;

  const regRes = await request('/api/recruiter/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: uniqueCompanyName,
      email: uniqueEmail,
      password: 'RecruiterPassword123!',
      industry: 'Information Technology',
      location: 'San Francisco, CA',
      website: 'https://techcorp.example.com'
    })
  });
  assert(regRes.status === 201, `Recruiter registration returned 201 (got ${regRes.status})`);
  assert(!!regRes.data.token, 'Registration returned JWT token');
  assert(regRes.data.company?.role === 'recruiter', 'Account role is recruiter');
  assert(regRes.data.company?.name === uniqueCompanyName, 'Company name matches');
  assert(regRes.data.company?.companyId.startsWith('COM-'), 'Company ID has COM- prefix');
  assert(regRes.data.company?.password === undefined, 'Password is withheld from response');

  // 2. Duplicate Recruiter Email / Company Name
  console.log('\n2. Testing Duplicate Company / Email Prevention:');
  const dupEmailRes = await request('/api/recruiter/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: `Different Name ${Date.now()}`,
      email: uniqueEmail,
      password: 'AnotherPassword123!',
      industry: 'Finance',
      location: 'New York, NY'
    })
  });
  assert(dupEmailRes.status === 400, 'Duplicate recruiter email rejected with status 400');

  // 3. Recruiter Login with Invalid Password
  console.log('\n3. Testing Recruiter Login with Invalid Password:');
  const invalidPassRes = await request('/api/recruiter/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'WrongPassword999!'
    })
  });
  assert(invalidPassRes.status === 401, 'Invalid password rejected with 401');
  assert(invalidPassRes.data.message.includes('Invalid recruiter credentials'), 'Clear error message returned');

  // 4. Valid Recruiter Login
  console.log('\n4. Testing Valid Recruiter Login:');
  const validLoginRes = await request('/api/recruiter/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'RecruiterPassword123!'
    })
  });
  assert(validLoginRes.status === 200, 'Valid recruiter login returned 200');
  assert(!!validLoginRes.data.token, 'Recruiter login returned JWT token');
  const recruiterToken = validLoginRes.data.token;

  // 5. Protected GET /api/recruiter/auth/me
  console.log('\n5. Testing Protected Recruiter Profile Endpoint:');
  const meRes = await request('/api/recruiter/auth/me', {
    headers: {
      Authorization: `Bearer ${recruiterToken}`
    }
  });
  assert(meRes.status === 200, 'Recruiter profile fetched successfully with 200');
  assert(meRes.data.company?.email === uniqueEmail, 'Email matches logged-in recruiter');
  assert(meRes.data.company?.role === 'recruiter', 'Role is recruiter');
  assert(meRes.data.company?.password === undefined, 'Password is withheld from profile');

  // 6. Create an Applicant and get Applicant Token for RBAC cross-checks
  console.log('\n6. Setting up Applicant Token for RBAC Cross-Check:');
  const applicantEmail = `applicant.rbac.${Date.now()}@example.com`;
  const appReg = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'RBAC Applicant',
      email: applicantEmail,
      password: 'ApplicantPassword123!'
    })
  });
  const applicantToken = appReg.data.token;
  assert(!!applicantToken, 'Applicant token created successfully');

  // 7. Role Isolation Test 1: Applicant cannot access Recruiter APIs
  console.log('\n7. RBAC Check 1: Applicant accessing Recruiter API:');
  const applicantToRecruiter = await request('/api/recruiter/auth/me', {
    headers: {
      Authorization: `Bearer ${applicantToken}`
    }
  });
  assert(applicantToRecruiter.status === 403, `Applicant blocked from Recruiter API with 403 Forbidden (got ${applicantToRecruiter.status})`);
  assert(applicantToRecruiter.data.message.includes('Forbidden'), 'Clear forbidden message returned');

  // 8. Role Isolation Test 2: Recruiter cannot access Applicant APIs
  console.log('\n8. RBAC Check 2: Recruiter accessing Applicant API:');
  const recruiterToApplicant = await request('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${recruiterToken}`
    }
  });
  assert(recruiterToApplicant.status === 403, `Recruiter blocked from Applicant API with 403 Forbidden (got ${recruiterToApplicant.status})`);
  assert(recruiterToApplicant.data.message.includes('Forbidden'), 'Clear forbidden message returned');

  // 9. Recruiter Logout
  console.log('\n9. Testing Recruiter Logout:');
  const logoutRes = await request('/api/recruiter/auth/logout', { method: 'POST' });
  assert(logoutRes.status === 200, 'Recruiter logout returned status 200');

  console.log('\n====================================================');
  console.log(`📊 Recruiter Auth & RBAC Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

testRecruiterAuth()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
