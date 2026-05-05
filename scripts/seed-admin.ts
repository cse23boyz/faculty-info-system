// scripts/seed-admin.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ⚠️ REPLACE THIS WITH YOUR ACTUAL MONGODB ATLAS URI
const MONGODB_URI = 'mongodb+srv://admin:admin123@fis.3yszimt.mongodb.net/?appName=fis';

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    email: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

AdminSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const existingAdmin = await Admin.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      await mongoose.disconnect();
      return;
    }

    const admin = await Admin.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@jacsice.edu',
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Username: admin`);
    console.log(`   Password: admin123`);
    console.log(`   Email: admin@jacsice.edu`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

seedAdmin();