const baseUrl = 'http://localhost:5000';

async function testAuth() {
  console.log('====================================================');
  console.log('🔐 STEP 3: Applicant Authentication API Tests');
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

  // 1. Register with valid details
  console.log('1. Testing Applicant Registration:');
  const uniqueEmail = `sarah.connor.${Date.now()}@example.com`;
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Sarah Connor',
      email: uniqueEmail,
      password: 'Password123!',
      phone: '+1 555-0144',
      location: 'Los Angeles, CA',
      skills: 'React, Node.js, Express, MongoDB, Tailwind CSS'
    })
  });
  assert(regRes.status === 201, `Registration returned status 201 (got ${regRes.status})`);
  assert(!!regRes.data.token, 'Registration response includes JWT token');
  assert(regRes.data.user?.email === uniqueEmail, 'Registration response includes user profile');
  assert(regRes.data.user?.password === undefined, 'Password is not exposed in registration response');

  // 2. Duplicate email registration
  console.log('\n2. Testing Duplicate Email Prevention:');
  const dupRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate Sarah',
      email: uniqueEmail,
      password: 'AnotherPassword123!'
    })
  });
  assert(dupRes.status === 400, `Duplicate email rejected with status 400 (got ${dupRes.status})`);
  assert(dupRes.data.message.includes('already exists'), 'Duplicate email returned clear error message');

  // 3. Validation rejection for invalid email
  console.log('\n3. Testing Input Validation (Bad Email):');
  const badEmailRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bad Email User',
      email: 'not-an-email',
      password: 'ValidPassword123!'
    })
  });
  assert(badEmailRes.status === 400, 'Invalid email format rejected with 400');

  // 4. Validation rejection for short password
  console.log('\n4. Testing Input Validation (Short Password):');
  const shortPassRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Short Pass User',
      email: 'short.pass@example.com',
      password: '123'
    })
  });
  assert(shortPassRes.status === 400, 'Password < 6 chars rejected with 400');

  // 5. Login with invalid password
  console.log('\n5. Testing Login with Invalid Password:');
  const invalidPassLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'WrongPassword999!'
    })
  });
  assert(invalidPassLogin.status === 401, `Invalid password returned 401 (got ${invalidPassLogin.status})`);
  assert(invalidPassLogin.data.message.includes('Invalid credentials'), 'Invalid credentials message returned');

  // 6. Login with nonexistent email
  console.log('\n6. Testing Login with Nonexistent Email:');
  const noUserLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'nobody@example.com',
      password: 'Password123!'
    })
  });
  assert(noUserLogin.status === 401, `Nonexistent user returned 401 (got ${noUserLogin.status})`);

  // 7. Login with valid credentials
  console.log('\n7. Testing Valid Login:');
  const validLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'Password123!'
    })
  });
  assert(validLogin.status === 200, `Valid login returned 200 (got ${validLogin.status})`);
  assert(!!validLogin.data.token, 'Login returned JWT token');
  const userToken = validLogin.data.token;

  // 8. Protected GET /api/auth/me without token
  console.log('\n8. Testing Protected Route Without Token:');
  const noTokenMe = await request('/api/auth/me');
  assert(noTokenMe.status === 401, `Access denied without token (got ${noTokenMe.status})`);

  // 9. Protected GET /api/auth/me with valid Bearer token
  console.log('\n9. Testing Protected Route With Bearer Token:');
  const validMe = await request('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${userToken}`
    }
  });
  assert(validMe.status === 200, `Access granted with token (got ${validMe.status})`);
  assert(validMe.data.user?.email === uniqueEmail, 'User data matched authenticated applicant');
  assert(validMe.data.user?.password === undefined, 'Password is not exposed in me response');

  // 10. Logout endpoint
  console.log('\n10. Testing Logout Endpoint:');
  const logoutRes = await request('/api/auth/logout', { method: 'POST' });
  assert(logoutRes.status === 200, 'Logout returned status 200');

  console.log('\n====================================================');
  console.log(`📊 Auth API Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

testAuth()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });
