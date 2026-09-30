const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job_application_tracker';

async function viewData() {
  try {
    await mongoose.connect(uri);
    console.log(`\n==================================================`);
    console.log(`📊 Connected to Database: job_application_tracker`);
    console.log(`==================================================\n`);

    const collections = await mongoose.connection.db.listCollections().toArray();

    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`📁 Collection: [${col.name}] (${count} documents)`);
      
      const samples = await mongoose.connection.db.collection(col.name)
        .find({})
        .limit(2)
        .toArray();

      if (samples.length > 0) {
        console.log('   Sample preview:');
        console.log(JSON.stringify(samples, null, 2).split('\n').map(l => '     ' + l).join('\n'));
      }
      console.log('--------------------------------------------------\n');
    }
  } catch (err) {
    console.error('Error reading database:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  }
}

viewData();
