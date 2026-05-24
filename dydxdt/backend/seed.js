/**
 * seed.js — Run once to create the initial admin user
 *
 * Usage:
 *   node seed.js
 *
 * Requires MONGODB_URI and admin credentials to be in .env
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Minimal User schema inline (to avoid loading full app)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seed() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dydxdt.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
      // Ensure role is admin
      if (existing.role !== 'admin') {
        await User.updateOne({ email: ADMIN_EMAIL }, { role: 'admin' });
        console.log('✅ Role updated to admin');
      }
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    console.log(`✅ Admin user created:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n⚠️  Change your password after first login!`);

  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
