const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'presentation_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Starting Puppeteer screenshot capture with Edge...');

  // 1. Get tokens via API
  const appRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aaryan451@gmail.com', password: 'Password123!' })
  });
  const appData = await appRes.json();
  const applicantToken = appData.token;
  const applicantUser = appData.user;

  const recRes = await fetch('http://localhost:5000/api/recruiter/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farhan11@gmail.com', password: 'Password123!' })
  });
  const recData = await recRes.json();
  const recruiterToken = recData.token;
  const recruiterUser = recData.company;

  console.log('✅ Tokens obtained successfully.');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  // Helper to set auth state in localStorage
  async function setAuth(token, user) {
    await page.goto('http://localhost:5173/jobs', { waitUntil: 'networkidle0' });
    await page.evaluate((t, u) => {
      if (t && u) {
        localStorage.setItem('token', t);
        localStorage.setItem('user', JSON.stringify(u));
      } else {
        localStorage.clear();
      }
    }, token, user);
  }

  // --- SCREENSHOT 1: Public / Applicant Job Search & Listings (READ Jobs) ---
  console.log('📸 1. Capturing Job Listings (READ)...');
  await setAuth(null, null);
  await page.goto('http://localhost:5173/jobs', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_crud_read_job_listings.png') });

  // --- SCREENSHOT 2: Job Detail View (READ Detailed) ---
  console.log('📸 2. Capturing Job Detail View (READ)...');
  await page.goto('http://localhost:5173/jobs/6ab20c6551deb0ad90eee4a2', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_crud_read_job_detail.png') });

  // --- SCREENSHOT 3: Applicant Login & Dashboard (READ Stats & Pipeline) ---
  console.log('📸 3. Capturing Applicant Dashboard (READ)...');
  await setAuth(applicantToken, applicantUser);
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_crud_read_applicant_dashboard.png') });

  // --- SCREENSHOT 4: My Applications List (READ Applications) ---
  console.log('📸 4. Capturing My Applications List (READ)...');
  await page.goto('http://localhost:5173/applications', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_crud_read_my_applications.png') });

  // --- SCREENSHOT 5: Application Status Stepper & Progress (READ / TRACK) ---
  console.log('📸 5. Capturing Application Detail & Timeline...');
  await page.goto('http://localhost:5173/applications/6ab20c7f51deb0ad90eee4fc', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_crud_read_application_stepper.png') });

  // --- SCREENSHOT 6: Applicant Submit Application (CREATE Application) ---
  console.log('📸 6. Capturing Application Submission Form (CREATE)...');
  await page.goto('http://localhost:5173/jobs/6ab17b5c1894d1603546ee17/apply', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_crud_create_job_application.png') });

  // --- SCREENSHOT 7: Resume Management (CREATE, READ, UPDATE, DELETE Resumes) ---
  console.log('📸 7. Capturing Resume Management (FULL CRUD)...');
  await page.goto('http://localhost:5173/resumes', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_crud_resume_management.png') });

  // --- SCREENSHOT 8: Recruiter Dashboard & Active Jobs (READ & MANAGE) ---
  console.log('📸 8. Capturing Recruiter Dashboard (READ & MANAGE)...');
  await setAuth(recruiterToken, recruiterUser);
  await page.goto('http://localhost:5173/recruiter/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_crud_recruiter_dashboard.png') });

  // --- SCREENSHOT 9: Recruiter Post New Job Modal (CREATE Job) ---
  console.log('📸 9. Capturing Recruiter Post Job Modal (CREATE)...');
  try {
    // Look for "Post Job" or "Post a Job" or button with plus icon
    const postBtn = await page.waitForSelector('button:has-text("Post"), button:has-text("New Job"), button:has-text("Create")', { timeout: 3000 }).catch(() => null);
    if (!postBtn) {
      // Find button by evaluate
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.toLowerCase().includes('post') || b.textContent.toLowerCase().includes('job'));
        if (btn) btn.click();
      });
    } else {
      await postBtn.click();
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09_crud_create_job_modal.png') });
  } catch (err) {
    console.warn('Could not open post job modal:', err.message);
  }

  // --- SCREENSHOT 10: Recruiter Application Review & Status Update (UPDATE Status) ---
  console.log('📸 10. Capturing Recruiter Application Review (UPDATE)...');
  await page.goto('http://localhost:5173/recruiter/applications/6ab20c7f51deb0ad90eee4fc', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_crud_update_recruiter_review.png') });

  // --- SCREENSHOT 11: Recruiter All Applications Pipeline View ---
  console.log('📸 11. Capturing Recruiter Candidate Pipeline...');
  await page.goto('http://localhost:5173/recruiter/applications', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_crud_read_recruiter_applications.png') });

  await browser.close();
  console.log('🎉 All screenshots successfully captured into presentation_assets!');
}

capture().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
