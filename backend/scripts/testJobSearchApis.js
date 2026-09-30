const baseUrl = 'http://localhost:5000';

async function testJobSearch() {
  console.log('====================================================');
  console.log('🔍 STEP 6: Applicant Job Search & Filters Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function request(url) {
    const res = await fetch(`${baseUrl}${url}`);
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

  // Setup: Create a Company and seed jobs with distinct attributes (Pune, developer, Full-time, etc.)
  const recData = {
    name: `SearchTest Corp ${Date.now()}`,
    email: `recruiter.search.${Date.now()}@searchtest.com`,
    password: 'Password123!',
    industry: 'Software',
    location: 'Pune, India',
    website: 'https://searchtest.example.com'
  };
  const recRes = await fetch(`${baseUrl}/api/recruiter/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recData)
  });
  const recJson = await recRes.json();
  const token = recJson.token;

  // Post Job 1: React Developer in Pune (Full-time, Senior Level)
  const job1Res = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'Senior Frontend Developer (React)',
      description: 'Build user interfaces with modern React, Tailwind, and Vite.',
      location: 'Pune, India',
      type: 'Full-time',
      experienceLevel: 'Senior Level'
    })
  });
  const job1 = (await job1Res.json()).job;

  // Post Job 2: Backend Developer in Pune (Remote, Entry Level)
  const job2Res = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'Junior Python Developer',
      description: 'Develop microservices and APIs with FastAPI and Docker.',
      location: 'Pune, India',
      type: 'Remote',
      experienceLevel: 'Entry Level'
    })
  });
  const job2 = (await job2Res.json()).job;

  // Post Job 3: Closed Job (Should never show up in search)
  const job3Res = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'Closed Position Specialist',
      description: 'This position should be closed immediately.',
      location: 'Pune, India',
      type: 'Contract',
      experienceLevel: 'Mid Level'
    })
  });
  const job3 = (await job3Res.json()).job;
  await fetch(`${baseUrl}/api/jobs/${job3._id}/close`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });

  // 1. Search by title keyword: 'developer'
  console.log('1. Testing GET /api/jobs?search=developer:');
  const searchDev = await request('/api/jobs?search=developer');
  assert(searchDev.status === 200, 'Search returned status 200');
  assert(searchDev.data.jobs.some(j => j._id === job1._id), 'Found React Developer in search=developer');
  assert(searchDev.data.jobs.some(j => j._id === job2._id), 'Found Python Developer in search=developer');
  assert(!searchDev.data.jobs.some(j => j._id === job3._id), 'Closed job excluded from search results');

  // 2. Search by location: 'Pune'
  console.log('\n2. Testing GET /api/jobs?location=Pune:');
  const searchPune = await request('/api/jobs?location=Pune');
  assert(searchPune.status === 200, 'Location search returned status 200');
  assert(searchPune.data.jobs.every(j => j.location.toLowerCase().includes('pune')), 'All results matched Pune');

  // 3. Filter by type: 'Full-Time' (case-insensitive)
  console.log('\n3. Testing GET /api/jobs?type=Full-Time:');
  const filterType = await request('/api/jobs?type=Full-Time');
  assert(filterType.status === 200, 'Type filter returned status 200');
  assert(filterType.data.jobs.some(j => j._id === job1._id), 'Job 1 found for type=Full-Time');
  assert(!filterType.data.jobs.some(j => j._id === job2._id), 'Job 2 (Remote) excluded from type=Full-Time');

  // 4. Filter by experience level: 'Senior Level'
  console.log('\n4. Testing GET /api/jobs?experienceLevel=Senior%20Level:');
  const filterExp = await request('/api/jobs?experienceLevel=Senior%20Level');
  assert(filterExp.status === 200, 'Experience filter returned status 200');
  assert(filterExp.data.jobs.some(j => j._id === job1._id), 'Senior job found in experience filter');
  assert(!filterExp.data.jobs.some(j => j._id === job2._id), 'Entry level job excluded from Senior filter');

  // 5. Sorting: newest vs oldest
  console.log('\n5. Testing Sort: ?sort=newest & ?sort=oldest:');
  const sortNew = await request('/api/jobs?sort=newest');
  const sortOld = await request('/api/jobs?sort=oldest');
  assert(sortNew.status === 200 && sortOld.status === 200, 'Sorting endpoints returned 200');
  assert(sortNew.data.jobs.length >= 2, 'Multiple jobs available for sort verification');

  // 6. View Single Job Details: GET /api/jobs/:id
  console.log('\n6. Testing GET /api/jobs/:id:');
  const detailRes = await request(`/api/jobs/${job1._id}`);
  assert(detailRes.status === 200, 'Job details returned 200');
  assert(detailRes.data.job?.title === 'Senior Frontend Developer (React)', 'Title matches');
  assert(detailRes.data.job?.location === 'Pune, India', 'Location matches');
  assert(detailRes.data.job?.type === 'Full-time', 'Type matches');
  assert(detailRes.data.job?.experienceLevel === 'Senior Level', 'Experience level matches');
  assert(detailRes.data.job?.companyId?.name.includes('SearchTest Corp'), 'Company name populated');
  assert(detailRes.data.job?.companyId?.industry === 'Software', 'Company industry populated');
  assert(detailRes.data.job?.companyId?.website !== undefined, 'Company website populated');

  console.log('\n====================================================');
  console.log(`📊 Job Search API Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

testJobSearch()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });
