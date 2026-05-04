require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Machine  = require('../models/Machine');
const User     = require('../models/User');
const Session  = require('../models/Session');
const Report   = require('../models/Report');

const m = (name, block, type, status = 'Available') => ({ name, block, type, status, sessionDurationMinutes: 45 });

const machines = [
  // ── Block A ── 4 Washers · 3 Dryers
  m('Washer A-1', 'A', 'Washer'),
  m('Washer A-2', 'A', 'Washer'),
  m('Washer A-3', 'A', 'Washer'),
  m('Washer A-4', 'A', 'Washer'),
  m('Dryer A-1',  'A', 'Dryer'),
  m('Dryer A-2',  'A', 'Dryer'),
  m('Dryer A-3',  'A', 'Dryer', 'Out of Order'),

  // ── Block B ── 5 Washers · 2 Dryers
  m('Washer B-1', 'B', 'Washer'),
  m('Washer B-2', 'B', 'Washer'),
  m('Washer B-3', 'B', 'Washer'),
  m('Washer B-4', 'B', 'Washer'),
  m('Washer B-5', 'B', 'Washer', 'Out of Order'),
  m('Dryer B-1',  'B', 'Dryer'),
  m('Dryer B-2',  'B', 'Dryer'),

  // ── Block C ── 4 Washers · 3 Dryers
  m('Washer C-1', 'C', 'Washer'),
  m('Washer C-2', 'C', 'Washer'),
  m('Washer C-3', 'C', 'Washer'),
  m('Washer C-4', 'C', 'Washer'),
  m('Dryer C-1',  'C', 'Dryer'),
  m('Dryer C-2',  'C', 'Dryer'),
  m('Dryer C-3',  'C', 'Dryer'),
];

const adminUser = {
  name: 'Admin User',
  email: 'admin@laundry.com',
  password: 'admin123',
  role: 'admin',
};

const seed = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is missing');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await Session.deleteMany({});
  await Report.deleteMany({});
  await Machine.deleteMany({});
  await User.deleteMany({ email: adminUser.email });

  await Machine.insertMany(machines);
  console.log(`Seeded ${machines.length} machines across Blocks A, B, C`);

  await User.create(adminUser);
  console.log('Admin user created: admin@laundry.com / admin123');

  await mongoose.disconnect();
  console.log('Seed complete.');
};

seed().catch((err) => { console.error(err); process.exit(1); });
