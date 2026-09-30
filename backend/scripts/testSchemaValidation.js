const mongoose = require('mongoose');
const {
  Applicant,
  Company,
  JobPosting,
  Resume,
  Application
} = require('../models');

async function testSchemaValidations() {
  console.log('====================================================');
  console.log('🔬 Mongoose Schema Architecture & Field Validation');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Applicant Model
  console.log('1. Verifying Applicant Model:');
  const applicantPaths = Applicant.schema.paths;
  assert(applicantPaths.name.isRequired, 'Applicant.name is required');
  assert(applicantPaths.email.isRequired, 'Applicant.email is required');
  assert(Applicant.schema.indexes().some(idx => idx[0].email === 1 && idx[1]?.unique), 'Applicant.email has unique index');
  assert(applicantPaths.password.isRequired, 'Applicant.password is required');
  assert(applicantPaths.password.options.select === false, 'Applicant.password is excluded by default (select: false)');
  assert(applicantPaths.phone !== undefined, 'Applicant.phone field exists');
  assert(applicantPaths.location !== undefined, 'Applicant.location field exists');
  assert(applicantPaths.skills !== undefined, 'Applicant.skills field exists');
  assert(typeof Applicant.prototype.comparePassword === 'function', 'Applicant.comparePassword method exists');
  assert(typeof Applicant.prototype.updateProfile === 'function', 'Applicant.updateProfile method exists');
  assert(typeof Applicant.prototype.applyForJob === 'function', 'Applicant.applyForJob method exists');
  assert(typeof Applicant.prototype.viewApplications === 'function', 'Applicant.viewApplications method exists');
  assert(Applicant.schema.virtuals.id !== undefined, 'Applicant.id virtual exists');
  assert(Applicant.schema.virtuals.applications !== undefined, 'Applicant.applications virtual relationship exists');
  assert(Applicant.schema.virtuals.resumes !== undefined, 'Applicant.resumes virtual relationship exists');

  // 2. Company Model
  console.log('\n2. Verifying Company Model:');
  const companyPaths = Company.schema.paths;
  assert(companyPaths.companyId !== undefined, 'Company.companyId exists');
  assert(companyPaths.name.isRequired, 'Company.name is required');
  assert(companyPaths.industry.isRequired, 'Company.industry is required');
  assert(companyPaths.location.isRequired, 'Company.location is required');
  assert(companyPaths.website !== undefined, 'Company.website exists');
  assert(typeof Company.prototype.addJobPosting === 'function', 'Company.addJobPosting method exists');
  assert(typeof Company.prototype.updateCompany === 'function', 'Company.updateCompany method exists');
  assert(typeof Company.prototype.viewJobPostings === 'function', 'Company.viewJobPostings method exists');
  assert(Company.schema.virtuals.id !== undefined, 'Company.id virtual exists');
  assert(Company.schema.virtuals.jobPostings !== undefined, 'Company.jobPostings virtual relationship exists');

  // 3. JobPosting Model
  console.log('\n3. Verifying JobPosting Model:');
  const jobPaths = JobPosting.schema.paths;
  assert(jobPaths.jobId !== undefined, 'JobPosting.jobId exists');
  assert(jobPaths.companyId.isRequired, 'JobPosting.companyId is required');
  assert(jobPaths.companyId.options.ref === 'Company', 'JobPosting.companyId references Company');
  assert(jobPaths.title.isRequired, 'JobPosting.title is required');
  assert(jobPaths.description.isRequired, 'JobPosting.description is required');
  assert(jobPaths.location.isRequired, 'JobPosting.location is required');
  assert(jobPaths.type.isRequired, 'JobPosting.type is required');
  assert(jobPaths.type.enumValues.includes('Full-time'), 'JobPosting.type includes Full-time');
  assert(jobPaths.experienceLevel.isRequired, 'JobPosting.experienceLevel is required');
  assert(jobPaths.postedDate !== undefined, 'JobPosting.postedDate exists');
  assert(jobPaths.isActive !== undefined, 'JobPosting.isActive exists');
  assert(typeof JobPosting.prototype.viewDetails === 'function', 'JobPosting.viewDetails method exists');
  assert(typeof JobPosting.prototype.updateJob === 'function', 'JobPosting.updateJob method exists');
  assert(typeof JobPosting.prototype.closeJob === 'function', 'JobPosting.closeJob method exists');
  assert(typeof JobPosting.prototype.getApplications === 'function', 'JobPosting.getApplications method exists');
  assert(JobPosting.schema.virtuals.id !== undefined, 'JobPosting.id virtual exists');
  assert(JobPosting.schema.virtuals.applications !== undefined, 'JobPosting.applications virtual relationship exists');

  // 4. Resume Model
  console.log('\n4. Verifying Resume Model:');
  const resumePaths = Resume.schema.paths;
  assert(resumePaths.resumeId !== undefined, 'Resume.resumeId exists');
  assert(resumePaths.applicantId.isRequired, 'Resume.applicantId is required');
  assert(resumePaths.applicantId.options.ref === 'Applicant', 'Resume.applicantId references Applicant');
  assert(resumePaths.fileName.isRequired, 'Resume.fileName is required');
  assert(resumePaths.filePath.isRequired, 'Resume.filePath is required');
  assert(resumePaths.uploadedAt !== undefined, 'Resume.uploadedAt exists');
  assert(typeof Resume.upload === 'function', 'Resume.upload static method exists');
  assert(typeof Resume.prototype.deleteFile === 'function', 'Resume.deleteFile method exists');
  assert(typeof Resume.prototype.getFile === 'function', 'Resume.getFile method exists');
  assert(Resume.schema.virtuals.id !== undefined, 'Resume.id virtual exists');

  // 5. Application Model
  console.log('\n5. Verifying Application Model:');
  const appPaths = Application.schema.paths;
  assert(appPaths.applicationId !== undefined, 'Application.applicationId exists');
  assert(appPaths.applicantId.isRequired, 'Application.applicantId is required');
  assert(appPaths.applicantId.options.ref === 'Applicant', 'Application.applicantId references Applicant');
  assert(appPaths.jobId.isRequired, 'Application.jobId is required');
  assert(appPaths.jobId.options.ref === 'JobPosting', 'Application.jobId references JobPosting');
  assert(appPaths.resumeId.isRequired, 'Application.resumeId is required');
  assert(appPaths.resumeId.options.ref === 'Resume', 'Application.resumeId references Resume');
  assert(appPaths.appliedDate !== undefined, 'Application.appliedDate exists');
  assert(appPaths.status.isRequired, 'Application.status is required');
  assert(appPaths.status.enumValues.includes('Applied'), 'Application.status includes Applied');
  assert(appPaths.status.enumValues.includes('Shortlisted'), 'Application.status includes Shortlisted');
  assert(appPaths.status.enumValues.includes('Rejected'), 'Application.status includes Rejected');
  assert(appPaths.status.enumValues.includes('Hired'), 'Application.status includes Hired');
  assert(appPaths.status.enumValues.includes('Withdrawn'), 'Application.status includes Withdrawn');
  assert(appPaths.coverLetter !== undefined, 'Application.coverLetter exists');
  assert(appPaths.notes !== undefined, 'Application.notes exists');
  assert(Application.schema.indexes().some(idx => idx[0].applicantId === 1 && idx[0].jobId === 1 && idx[1]?.unique), 'Application has unique compound index on { applicantId, jobId }');
  assert(typeof Application.prototype.updateStatus === 'function', 'Application.updateStatus method exists');
  assert(typeof Application.prototype.withdraw === 'function', 'Application.withdraw method exists');
  assert(typeof Application.prototype.viewDetails === 'function', 'Application.viewDetails method exists');
  assert(Application.schema.virtuals.id !== undefined, 'Application.id virtual exists');

  // Test validation error triggers
  console.log('\n6. Testing Input Validation Error Rules:');
  const invalidApplicant = new Applicant({});
  const applicantErr = invalidApplicant.validateSync();
  assert(applicantErr.errors.name !== undefined, 'Applicant name validation fails when missing');
  assert(applicantErr.errors.email !== undefined, 'Applicant email validation fails when missing');
  assert(applicantErr.errors.password !== undefined, 'Applicant password validation fails when missing');

  const invalidEmailApplicant = new Applicant({ name: 'Test', email: 'not-an-email', password: '123' });
  const emailErr = invalidEmailApplicant.validateSync();
  assert(emailErr.errors.email !== undefined, 'Applicant email regex rejects invalid email format');
  assert(emailErr.errors.password !== undefined, 'Applicant password rejects length < 6');

  const invalidApp = new Application({ status: 'InvalidStatus' });
  const appErr = invalidApp.validateSync();
  assert(appErr.errors.status !== undefined, 'Application status rejects unsupported status string');
  assert(appErr.errors.applicantId !== undefined, 'Application requires applicantId');
  assert(appErr.errors.jobId !== undefined, 'Application requires jobId');
  assert(appErr.errors.resumeId !== undefined, 'Application requires resumeId');

  console.log('\n====================================================');
  console.log(`📊 Validation Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

testSchemaValidations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
