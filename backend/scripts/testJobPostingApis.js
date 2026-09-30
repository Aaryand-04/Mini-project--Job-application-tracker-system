const baseUrl = 'http://localhost:5000';

async function testJobPostings() {
  console.log('====================================================');
  console.log('📋 STEP 5: Job Posting Management & RBAC Tests');
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

  // Setup: Register Company A (Recruiter 1)
  const compAEmail = `recruiterA.${Date.now()}@companya.com`;
  const compARes = await request('/api/recruiter/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: `Company Alpha ${Date.now()}`,
      email: compAEmail,
      password: 'Password123!',
      industry: 'Cloud Computing',
      location: 'Seattle, WA',
      website: 'https://alpha.example.com'
    })
  });
  const tokenA = compARes.data.token;
  const companyAId = compARes.data.company._id;

  // Setup: Register Company B (Recruiter 2 for cross-company isolation check)
  const compBEmail = `recruiterB.${Date.now()}@companyb.com`;
  const compBRes = await request('/api/recruiter/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: `Company Beta ${Date.now()}`,
      email: compBEmail,
      password: 'Password123!',
      industry: 'Cybersecurity',
      location: 'Austin, TX'
    })
  });
  const tokenB = compBRes.data.token;

  // Setup: Register Applicant (for applicant permission check)
  const appEmail = `applicant.jobtest.${Date.now()}@example.com`;
  const appRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Applicant',
      email: appEmail,
      password: 'Password123!'
    })
  });
  const applicantToken = appRes.data.token;

  // 1. Recruiter creates job posting
  console.log('1. Testing Recruiter Job Creation:');
  const createRes = await request('/api/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Senior React Developer',
      description: 'We are seeking an experienced frontend specialist with React and Tailwind CSS.',
      location: 'Remote, US',
      type: 'Full-time',
      experienceLevel: 'Senior Level'
    })
  });
  assert(createRes.status === 201, `Job created with status 201 (got ${createRes.status})`);
  assert(createRes.data.job?.jobId.startsWith('JOB-'), 'jobId has JOB- prefix');
  assert(createRes.data.job?.isActive === true, 'Job posting isActive is true by default');
  assert(createRes.data.job?.companyId?.name.includes('Company Alpha'), 'Job linked to Company Alpha');
  const jobId = createRes.data.job._id;

  // 2. Unauthenticated user cannot create job posting
  console.log('\n2. Testing Unauthorized Job Creation (No Token):');
  const noAuthCreate = await request('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Hacker Job',
      description: 'Should fail',
      location: 'Nowhere',
      type: 'Full-time',
      experienceLevel: 'Entry Level'
    })
  });
  assert(noAuthCreate.status === 401, 'Unauthenticated job creation rejected with 401');

  // 3. Applicant cannot create job posting
  console.log('\n3. Testing Applicant Cannot Create Job Posting:');
  const applicantCreate = await request('/api/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${applicantToken}` },
    body: JSON.stringify({
      title: 'Applicant Created Job',
      description: 'Should fail',
      location: 'Nowhere',
      type: 'Full-time',
      experienceLevel: 'Entry Level'
    })
  });
  assert(applicantCreate.status === 403, `Applicant blocked from job creation with 403 Forbidden (got ${applicantCreate.status})`);

  // 4. View public job listings (Applicants and Public)
  console.log('\n4. Testing Public Job Listings:');
  const publicList = await request('/api/jobs');
  assert(publicList.status === 200, 'Public job listings returned 200');
  assert(Array.isArray(publicList.data.jobs), 'Jobs returned as array');
  assert(publicList.data.jobs.some(j => j._id === jobId), 'Created job found in public listings');

  // 5. View single job details
  console.log('\n5. Testing View Job Details:');
  const jobDetail = await request(`/api/jobs/${jobId}`);
  assert(jobDetail.status === 200, 'Job details returned 200');
  assert(jobDetail.data.job?.title === 'Senior React Developer', 'Title matches');
  assert(jobDetail.data.job?.companyId?.name.includes('Company Alpha'), 'Company details populated');

  // 6. Recruiter edits job posting
  console.log('\n6. Testing Recruiter Edit Job:');
  const editRes = await request(`/api/jobs/${jobId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Staff React Developer (Updated)',
      description: 'Updated description requiring 6+ years of expertise in React.',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      experienceLevel: 'Lead / Executive'
    })
  });
  assert(editRes.status === 200, 'Job edited successfully with 200');
  assert(editRes.data.job?.title === 'Staff React Developer (Updated)', 'Updated title saved');
  assert(editRes.data.job?.experienceLevel === 'Lead / Executive', 'Updated experience level saved');

  // 7. Company isolation: Company B cannot edit Company A's job
  console.log('\n7. Testing Cross-Company Isolation (Edit):');
  const badEditRes = await request(`/api/jobs/${jobId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      title: 'Malicious Overwrite',
      description: 'Should fail',
      location: 'Nowhere',
      type: 'Contract',
      experienceLevel: 'Entry Level'
    })
  });
  assert(badEditRes.status === 403, `Company B blocked from editing Company A's job with 403 (got ${badEditRes.status})`);

  // 8. Close job posting
  console.log('\n8. Testing Close Job Posting:');
  const closeRes = await request(`/api/jobs/${jobId}/close`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(closeRes.status === 200, 'Close job returned 200');
  assert(closeRes.data.job?.isActive === false, 'Job isActive set to false');

  // Verify closed job is hidden from public listings
  const publicAfterClose = await request('/api/jobs');
  assert(!publicAfterClose.data.jobs.some(j => j._id === jobId), 'Closed job is excluded from public search listings');

  // 9. Activate job posting
  console.log('\n9. Testing Activate Job Posting:');
  const activateRes = await request(`/api/jobs/${jobId}/activate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(activateRes.status === 200, 'Activate job returned 200');
  assert(activateRes.data.job?.isActive === true, 'Job isActive set back to true');

  // 10. Recruiter views received applications for their job
  console.log('\n10. Testing View Applications for Job:');
  const appListRes = await request(`/api/jobs/${jobId}/applications`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(appListRes.status === 200, 'View applications returned 200');
  assert(Array.isArray(appListRes.data.applications), 'Applications returned as array');

  // 11. Cross-company isolation on view applications: Company B cannot view Company A's applications
  console.log('\n11. Testing Cross-Company Isolation (Applications):');
  const badViewApps = await request(`/api/jobs/${jobId}/applications`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  assert(badViewApps.status === 403, 'Company B blocked from viewing Company A’s applications with 403');

  // 12. Recruiter filters own company jobs (mine=true)
  console.log('\n12. Testing Recruiter Own Jobs (mine=true):');
  const myJobsRes = await request('/api/jobs?mine=true', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(myJobsRes.status === 200, 'mine=true returned 200');
  assert(myJobsRes.data.jobs.some(j => j._id === jobId), 'Company A job present in myJobs list');

  console.log('\n====================================================');
  console.log(`📊 Job Posting API Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

testJobPostings()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
