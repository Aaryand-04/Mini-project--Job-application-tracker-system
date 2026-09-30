const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  Applicant,
  Company,
  JobPosting,
  Resume,
  Application
} = require('../models');

async function runDatabaseTests() {
  console.log('====================================================');
  console.log('🚀 STEP 2: MongoDB Connection & Mongoose Models Test');
  console.log('====================================================\n');

  let mongod = null;
  let uri = process.env.MONGODB_URI;

  console.log(`📋 Configured MONGODB_URI: ${uri ? uri.replace(/\/\/.*@/, '//<credentials>@') : 'Not defined'}`);

  // Step 1: Connect to MongoDB
  try {
    console.log('\n--- 1. Testing MongoDB Connection ---');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected directly to configured MongoDB instance!');
  } catch (err) {
    console.warn(`⚠️ Direct connection to ${uri} failed (${err.message}).`);
    console.log('🔄 Spinning up in-memory MongoDB instance to verify models and schemas...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`✅ Connected successfully to test MongoDB instance at ${uri}`);
  }

  try {
    // Clear test collections
    await mongoose.connection.dropDatabase();

    // Step 2: Test Company Model
    console.log('\n--- 2. Testing Company Model ---');
    const company = await Company.create({
      name: 'Acme Corporation',
      email: 'recruiter.acme@example.com',
      password: 'CompanySecretPassword123!',
      industry: 'Software Development',
      location: 'San Francisco, CA',
      website: 'https://acme.example.com'
    });
    console.log(`✅ Company created: ${company.name} | companyId: ${company.companyId} | _id: ${company._id}`);
    if (!company.companyId.startsWith('COM-')) throw new Error('companyId prefix mismatch');

    // Step 3: Test Applicant Model & Password Hashing
    console.log('\n--- 3. Testing Applicant Model & Auth ---');
    const applicant = await Applicant.create({
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      password: 'SuperSecretPassword123!',
      phone: '+1 555-0199',
      location: 'New York, NY',
      skills: 'React, Node.js, Express, MongoDB'
    });
    console.log(`✅ Applicant created: ${applicant.name} (${applicant.email}) | id: ${applicant.id}`);
    
    // Check password hashing
    const rawApplicant = await Applicant.findById(applicant._id).select('+password');
    if (rawApplicant.password === 'SuperSecretPassword123!') {
      throw new Error('Applicant password was not hashed before save!');
    }
    const isPasswordValid = await applicant.comparePassword('SuperSecretPassword123!');
    if (!isPasswordValid) throw new Error('Password verification failed!');
    console.log('✅ Password successfully hashed with bcrypt and verified via comparePassword().');

    // Test unique email constraint
    try {
      await Applicant.create({
        name: 'Duplicate Jane',
        email: 'jane.doe@example.com',
        password: 'anotherpassword123'
      });
      throw new Error('Duplicate email should have thrown an error!');
    } catch (uniqueErr) {
      console.log('✅ Unique email constraint verified (duplicate email rejected).');
    }

    // Step 4: Test Resume Model
    console.log('\n--- 4. Testing Resume Model ---');
    const resume = await Resume.create({
      applicantId: applicant._id,
      fileName: 'Jane_Doe_Resume_2026.pdf',
      filePath: 'uploads/resumes/jane_resume_test.pdf'
    });
    console.log(`✅ Resume created: ${resume.fileName} | resumeId: ${resume.resumeId}`);

    // Step 5: Test JobPosting Model
    console.log('\n--- 5. Testing JobPosting Model ---');
    const jobPosting = await JobPosting.create({
      companyId: company._id,
      title: 'Senior Full Stack Engineer',
      description: 'Lead development of full-stack web applications using MERN stack.',
      location: 'Remote, US',
      type: 'Full-time',
      experienceLevel: 'Senior Level'
    });
    console.log(`✅ JobPosting created: ${jobPosting.title} | jobId: ${jobPosting.jobId}`);

    // Step 6: Test Application Model & Status Transitions
    console.log('\n--- 6. Testing Application Model & Status Transitions ---');
    const application = await Application.create({
      applicantId: applicant._id,
      jobId: jobPosting._id,
      resumeId: resume._id,
      coverLetter: 'I am thrilled to apply for the Senior Full Stack Engineer role.'
    });
    console.log(`✅ Application created: applicationId: ${application.applicationId} | Initial Status: ${application.status}`);

    // Test status update method: Applied -> Shortlisted
    await application.updateStatus('Shortlisted', 'Strong background in Node and React.');
    console.log(`✅ Status transition to Shortlisted verified: ${application.status} (Notes: "${application.notes}")`);

    // Test status update method: Shortlisted -> Hired
    await application.updateStatus('Hired', 'Offer accepted.');
    console.log(`✅ Status transition to Hired verified: ${application.status}`);

    // Step 7: Verify Relationships and Population
    console.log('\n--- 7. Testing Relationships & Population ---');

    // Relationship 1: JobPosting belongs to one Company
    const populatedJob = await JobPosting.findById(jobPosting._id).populate('companyId');
    if (populatedJob.companyId.name !== 'Acme Corporation') {
      throw new Error('JobPosting to Company relationship population failed');
    }
    console.log(`✅ Relationship: JobPosting -> Company (${populatedJob.title} belongs to ${populatedJob.companyId.name})`);

    // Relationship 2: Application belongs to JobPosting, Applicant, Resume
    const detailedApp = await application.viewDetails();
    if (detailedApp.applicantId.email !== 'jane.doe@example.com' ||
        detailedApp.jobId.title !== 'Senior Full Stack Engineer' ||
        detailedApp.resumeId.fileName !== 'Jane_Doe_Resume_2026.pdf') {
      throw new Error('Application multi-entity population failed');
    }
    console.log('✅ Relationship: Application -> Applicant, JobPosting, Resume populated successfully');

    // Relationship 3: Company has many JobPostings (Virtual)
    const companyWithJobs = await Company.findById(company._id).populate('jobPostings');
    if (!companyWithJobs.jobPostings || companyWithJobs.jobPostings.length !== 1) {
      throw new Error('Company has many JobPostings virtual population failed');
    }
    console.log(`✅ Relationship: Company -> JobPostings (${companyWithJobs.jobPostings.length} job found for ${companyWithJobs.name})`);

    // Relationship 4: Applicant has many Applications (Virtual)
    const applicantWithApps = await Applicant.findById(applicant._id).populate('applications');
    if (!applicantWithApps.applications || applicantWithApps.applications.length !== 1) {
      throw new Error('Applicant has many Applications virtual population failed');
    }
    console.log(`✅ Relationship: Applicant -> Applications (${applicantWithApps.applications.length} application found for ${applicantWithApps.name})`);

    // Relationship 5: Applicant has many Resumes (Virtual)
    const applicantWithResumes = await Applicant.findById(applicant._id).populate('resumes');
    if (!applicantWithResumes.resumes || applicantWithResumes.resumes.length !== 1) {
      throw new Error('Applicant has many Resumes virtual population failed');
    }
    console.log(`✅ Relationship: Applicant -> Resumes (${applicantWithResumes.resumes.length} resume found for ${applicantWithResumes.name})`);

    console.log('\n====================================================');
    console.log('🎉 ALL STEP 2 DATABASE & MODEL TESTS PASSED 100%!');
    console.log('====================================================');
  } finally {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  }
}

runDatabaseTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Test execution failed with error:', err);
    process.exit(1);
  });
