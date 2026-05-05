// models/Admin.ts
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin {
  username: string;
  password: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminDocument extends IAdmin, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdminDocument>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password - NO next() needed in Mongoose 9
AdminSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

AdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.models.Admin || mongoose.model<IAdminDocument>('Admin', AdminSchema);

export default Admin;