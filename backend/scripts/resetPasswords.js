const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function setDemoPasswords() {
  await mongoose.connect('mongodb://localhost:27017/job_application_tracker');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Password123!', salt);

  const res1 = await mongoose.connection.db.collection('applicants').updateMany(
    {},
    { $set: { password: hash } }
  );
  const res2 = await mongoose.connection.db.collection('companies').updateMany(
    {},
    { $set: { password: hash } }
  );

  console.log(`Updated ${res1.modifiedCount} applicants and ${res2.modifiedCount} companies to Password123!`);
  await mongoose.disconnect();
}
setDemoPasswords();
