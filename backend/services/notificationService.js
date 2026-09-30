const { Notification } = require('../models');

/**
 * Notify recruiter/company when a new job application is submitted
 */
const notifyRecruiterOnApplication = async ({ companyId, applicant, job, application }) => {
  try {
    const notification = await Notification.create({
      recipientId: companyId,
      recipientRole: 'recruiter',
      type: 'NEW_APPLICATION',
      title: 'New Application Received',
      message: `${applicant.name} has submitted an application for "${job.title}" (${job.location}). Application ID: ${application.applicationId}.`,
      applicantName: applicant.name,
      jobTitle: job.title,
      applicationDate: application.appliedDate || new Date(),
      applicationStatus: application.status || 'Applied',
      reviewLink: `/recruiter/dashboard?applicationId=${application._id}`,
      jobId: job._id,
      applicationId: application._id
    });

    console.log(`🔔 [NOTIFICATION] Recruiter notified for Company (${companyId}): New application ${application.applicationId} received from ${applicant.name}`);
    return notification;
  } catch (error) {
    console.error('Failed to create recruiter notification:', error.message);
    return null;
  }
};

/**
 * Notify applicant when a new job application is submitted (Step 13: Submission Confirmation)
 */
const notifyApplicantOnSubmission = async ({ applicantId, job, application, companyName }) => {
  try {
    const compName = companyName || job.companyId?.name || (job.companyId && typeof job.companyId === 'object' ? job.companyId.name : null) || 'the company';
    
    const notification = await Notification.create({
      recipientId: applicantId,
      recipientRole: 'applicant',
      applicantId: applicantId,
      type: 'APPLICATION_SUBMITTED',
      title: 'Application Submitted',
      message: `Your application for ${job.title} at ${compName} has been submitted successfully.`,
      jobTitle: job.title,
      applicationStatus: 'Applied',
      jobId: job._id,
      applicationId: application._id
    });

    console.log(`🔔 [NOTIFICATION] Applicant (${applicantId}) submission confirmation: Application ${application.applicationId} submitted for ${job.title} at ${compName}`);
    return notification;
  } catch (error) {
    console.error('Failed to create applicant submission notification:', error.message);
    return null;
  }
};

/**
 * Notify applicant when an application status changes (Step 13: Shortlisted / Rejected / Hired)
 */
const notifyApplicantOnStatusUpdate = async ({ applicantId, job, application, newStatus, companyName }) => {
  try {
    const compName = companyName || job.companyId?.name || (job.companyId && typeof job.companyId === 'object' ? job.companyId.name : null) || 'Company';

    let type = 'APPLICATION_STATUS_UPDATE';
    const lowerStatus = newStatus.toLowerCase();
    if (newStatus === 'Shortlisted') type = 'APPLICATION_SHORTLISTED';
    else if (newStatus === 'Rejected') type = 'APPLICATION_REJECTED';
    else if (newStatus === 'Hired') type = 'APPLICATION_HIRED';

    const notification = await Notification.create({
      recipientId: applicantId,
      recipientRole: 'applicant',
      applicantId: applicantId,
      type: type,
      title: 'Application Status Updated',
      message: `Your application for ${job.title} at ${compName} has been ${lowerStatus}.`,
      jobTitle: job.title,
      applicationStatus: newStatus,
      jobId: job._id,
      applicationId: application._id
    });

    console.log(`🔔 [NOTIFICATION] Applicant (${applicantId}) notified: Application ${application.applicationId} status is now ${newStatus} at ${compName}`);
    return notification;
  } catch (error) {
    console.error('Failed to create applicant status notification:', error.message);
    return null;
  }
};

module.exports = {
  notifyRecruiterOnApplication,
  notifyApplicantOnSubmission,
  notifyApplicantOnStatusUpdate
};
