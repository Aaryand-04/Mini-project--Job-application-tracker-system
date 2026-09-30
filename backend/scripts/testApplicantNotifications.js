const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const { Applicant, Company, JobPosting, Resume, Application, Notification } = require('../models');
const { generateToken } = require('../utils/jwt');

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step13_2026';

let server;
let baseUrl;
let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function makeRequest({ method, urlPath, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Applicant Notifications Test Suite (Step 13)...\n');

  try {
    // 0. Connect DB if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job_application_tracker');
    }

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`📡 Test server running on ${baseUrl}`);
        resolve();
      });
    });

    const timestamp = Date.now();

    // 1. Setting up Test Data
    console.log('\n--- 1. Setting Up Test Applicants & Company ---');
    const applicant1 = await Applicant.create({
      name: 'Ada Lovelace',
      email: `ada_${timestamp}@notif.test`,
      password: 'Password123!',
      phone: '9876543210',
      location: 'London, UK',
      skills: 'Algorithms, Mathematics'
    });
    const applicant1Token = generateToken({ id: applicant1._id, role: 'applicant' });

    const applicant2 = await Applicant.create({
      name: 'Charles Babbage',
      email: `charles_${timestamp}@notif.test`,
      password: 'Password123!',
      phone: '9876543211',
      location: 'London, UK',
      skills: 'Hardware, Computing'
    });
    const applicant2Token = generateToken({ id: applicant2._id, role: 'applicant' });

    const companyA = await Company.create({
      name: `Analytical Engines Inc ${timestamp}`,
      email: `engines_${timestamp}@notif.test`,
      password: 'Password123!',
      industry: 'Computing',
      location: 'London, UK',
      website: 'https://engines.test'
    });
    const companyAToken = generateToken({ id: companyA._id, role: 'recruiter' });

    const resume1 = await Resume.create({
      applicantId: applicant1._id,
      fileName: 'ada_resume.pdf',
      filePath: 'uploads/resumes/dummy_ada.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf'
    });

    const job1 = await JobPosting.create({
      title: 'Lead Algorithm Engineer',
      description: 'Design first computer algorithms.',
      location: 'London, UK',
      type: 'Full-time',
      experienceLevel: 'Senior Level',
      companyId: companyA._id,
      isActive: true
    });

    const job2 = await JobPosting.create({
      title: 'Difference Engine Operator',
      description: 'Operate specialized calculating machinery.',
      location: 'London, UK',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      companyId: companyA._id,
      isActive: true
    });

    console.log('Seed data created.');

    // 2. Initial Notification State
    console.log('\n--- 2. Testing Initial Notification State ---');
    // Unauthenticated
    const unauthRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications'
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated GET /api/notifications returns 401 Unauthorized');

    // Authenticated initial state
    const initialNotifsRes = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(initialNotifsRes.statusCode === 200, 'GET /api/notifications returns 200 OK');
    assert(initialNotifsRes.body.count === 0, 'Initial notification count is 0');
    assert(initialNotifsRes.body.unreadCount === 0, 'Initial unread count is 0');

    // 3. Test Notification 1: New Application Submitted Confirmation
    console.log('\n--- 3. Testing Notification 1: Application Submitted Confirmation ---');
    const applyRes1 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: {
        jobId: job1._id.toString(),
        resumeId: resume1._id.toString(),
        coverLetter: 'I would love to develop the algorithms for this machine.',
        notes: 'Available immediately'
      }
    });
    assert(applyRes1.statusCode === 201, 'Application 1 submitted with 201 Created');
    const app1Id = applyRes1.body.application._id;

    // Verify applicant received submission confirmation notification
    const postApplyNotifs = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(postApplyNotifs.statusCode === 200, 'Fetched notifications after application submission');
    assert(postApplyNotifs.body.count === 1, 'Applicant has 1 notification after applying');
    assert(postApplyNotifs.body.unreadCount === 1, 'Unread notification count is 1');

    const subNotif = postApplyNotifs.body.notifications[0];
    assert(subNotif.type === 'APPLICATION_SUBMITTED', 'Notification type is APPLICATION_SUBMITTED');
    assert(subNotif.title === 'Application Submitted', 'Notification title is "Application Submitted"');
    assert(
      subNotif.message.includes('Lead Algorithm Engineer') && subNotif.message.includes('submitted successfully'),
      'Notification message confirms submission for the specific job'
    );
    assert(subNotif.isRead === false, 'Notification is initially unread (isRead: false)');
    assert(subNotif.notificationId && subNotif.notificationId.startsWith('NOTIF-'), 'notificationId is formatted (NOTIF-XXXXXX)');
    assert(subNotif.applicantId.toString() === applicant1._id.toString(), 'applicantId matches authenticated applicant');
    assert(subNotif.applicationId._id.toString() === app1Id.toString(), 'applicationId matches submitted application');
    assert(Boolean(subNotif.createdAt), 'createdAt timestamp is present');

    // 4. Test Notification 2: Application Shortlisted
    console.log('\n--- 4. Testing Notification 2: Application Shortlisted ---');
    const shortlistRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app1Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: {
        status: 'Shortlisted',
        notes: 'Outstanding background in Bernoulli numbers calculation.'
      }
    });
    assert(shortlistRes.statusCode === 200, 'Recruiter updated status to Shortlisted (200 OK)');

    // Applicant fetches notifications
    const postShortlistNotifs = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(postShortlistNotifs.body.count === 2, 'Applicant now has 2 notifications');
    assert(postShortlistNotifs.body.unreadCount === 2, 'Applicant has 2 unread notifications');

    const shortlistNotif = postShortlistNotifs.body.notifications[0];
    assert(shortlistNotif.type === 'APPLICATION_SHORTLISTED', 'Notification type is APPLICATION_SHORTLISTED');
    assert(shortlistNotif.title === 'Application Status Updated', 'Notification title is "Application Status Updated"');
    assert(
      shortlistNotif.message === `Your application for ${job1.title} at ${companyA.name} has been shortlisted.`,
      'Notification message matches exact required format for Shortlisted'
    );
    assert(shortlistNotif.isRead === false, 'Shortlisted notification is unread');

    // 5. Test Notification 4: Application Hired
    console.log('\n--- 5. Testing Notification 3: Application Hired ---');
    const hiredRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app1Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: {
        status: 'Hired',
        notes: 'Welcome as the world’s first computer programmer!'
      }
    });
    assert(hiredRes.statusCode === 200, 'Recruiter updated status to Hired (200 OK)');

    // Applicant fetches notifications
    const postHiredNotifs = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(postHiredNotifs.body.count === 3, 'Applicant now has 3 notifications');
    assert(postHiredNotifs.body.unreadCount === 3, 'Applicant has 3 unread notifications');

    const hiredNotif = postHiredNotifs.body.notifications[0];
    assert(hiredNotif.type === 'APPLICATION_HIRED', 'Notification type is APPLICATION_HIRED');
    assert(hiredNotif.title === 'Application Status Updated', 'Notification title is "Application Status Updated"');
    assert(
      hiredNotif.message === `Your application for ${job1.title} at ${companyA.name} has been hired.`,
      'Notification message matches exact required format for Hired'
    );

    // 6. Test Notification 3: Application Rejected
    console.log('\n--- 6. Testing Notification 4: Application Rejected ---');
    // Applicant applies to Job 2
    const applyRes2 = await makeRequest({
      method: 'POST',
      urlPath: '/api/applications',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${applicant1Token}`
      },
      body: {
        jobId: job2._id.toString(),
        resumeId: resume1._id.toString(),
        coverLetter: 'Also interested in mechanical operation.',
        notes: 'Part-time interest'
      }
    });
    assert(applyRes2.statusCode === 201, 'Application 2 submitted with 201 Created');
    const app2Id = applyRes2.body.application._id;

    // Recruiter rejects Application 2
    const rejectRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/recruiter/applications/${app2Id}/status`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${companyAToken}`
      },
      body: {
        status: 'Rejected',
        notes: 'Overqualified for operator role.'
      }
    });
    assert(rejectRes.statusCode === 200, 'Recruiter updated status to Rejected (200 OK)');

    // Applicant fetches notifications
    const postRejectNotifs = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    const rejectNotif = postRejectNotifs.body.notifications[0];
    assert(rejectNotif.type === 'APPLICATION_REJECTED', 'Notification type is APPLICATION_REJECTED');
    assert(rejectNotif.title === 'Application Status Updated', 'Notification title is "Application Status Updated"');
    assert(
      rejectNotif.message === `Your application for ${job2.title} at ${companyA.name} has been rejected.`,
      'Notification message matches exact required format for Rejected'
    );

    // 7. Testing PATCH /api/notifications/:id/read
    console.log('\n--- 7. Testing PATCH /api/notifications/:id/read ---');
    const initialUnread = postRejectNotifs.body.unreadCount;
    const notifToMark = postRejectNotifs.body.notifications[0];

    const markReadRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/notifications/${notifToMark._id}/read`,
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(markReadRes.statusCode === 200, 'Mark notification as read by _id returned 200 OK');
    assert(markReadRes.body.notification.isRead === true, 'Notification isRead is now true');

    // Verify unread count decremented
    const afterOneRead = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(
      afterOneRead.body.unreadCount === initialUnread - 1,
      `Unread count decremented from ${initialUnread} to ${afterOneRead.body.unreadCount}`
    );

    // Also test marking as read using conceptual notificationId
    const secondNotifToMark = afterOneRead.body.notifications[1];
    const markByNotifIdRes = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/notifications/${secondNotifToMark.notificationId}/read`,
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(markByNotifIdRes.statusCode === 200, 'Mark notification as read by notificationId returned 200 OK');
    assert(markByNotifIdRes.body.notification.isRead === true, 'Notification isRead is true when marked by notificationId');

    // 8. Testing Cross-Applicant Isolation on Notifications
    console.log('\n--- 8. Testing Cross-Applicant Isolation on Notifications ---');
    // Applicant 2 fetches their notifications
    const app2Notifs = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${applicant2Token}` }
    });
    assert(app2Notifs.statusCode === 200, 'Applicant 2 retrieved notifications with 200 OK');
    assert(app2Notifs.body.count === 0, 'Applicant 2 has 0 notifications (no leakage from Applicant 1)');
    assert(app2Notifs.body.unreadCount === 0, 'Applicant 2 unreadCount is 0');

    // Applicant 2 attempts to mark Applicant 1's notification as read
    const crossMarkRead = await makeRequest({
      method: 'PATCH',
      urlPath: `/api/notifications/${notifToMark._id}/read`,
      headers: { Authorization: `Bearer ${applicant2Token}` }
    });
    assert(crossMarkRead.statusCode === 403, 'Applicant 2 forbidden from modifying Applicant 1’s notification (403)');

    // 9. Testing PATCH /api/notifications/read-all
    console.log('\n--- 9. Testing PATCH /api/notifications/read-all ---');
    const readAllRes = await makeRequest({
      method: 'PATCH',
      urlPath: '/api/notifications/read-all',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(readAllRes.statusCode === 200, 'PATCH /api/notifications/read-all returns 200 OK');

    // Verify all notifications are now marked as read
    const afterReadAll = await makeRequest({
      method: 'GET',
      urlPath: '/api/notifications',
      headers: { Authorization: `Bearer ${applicant1Token}` }
    });
    assert(afterReadAll.body.unreadCount === 0, 'Unread notification count is now 0 after read-all');
    const allAreRead = afterReadAll.body.notifications.every((n) => n.isRead === true);
    assert(allAreRead, 'All notifications have isRead: true');

    console.log(`\n🎉 ALL TESTS PASSED! (${testsPassed}/${totalTests})`);
  } catch (err) {
    console.error('\n❌ Test Suite encountered an error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

runTests();
