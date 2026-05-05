// models/Faculty.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFaculty {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  facultyCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  specialization: string;
  profilePhoto: string;
  joiningDate: Date;
  qualifications: {
    degree: string;
    institution: string;
    year: number;
  }[];
  publications: {
    title: string;
    journal: string;
    year: number;
    doi?: string;
  }[];
  status: 'active' | 'inactive' | 'on-leave';
  createdAt: Date;
  updatedAt: Date;
}

export interface IFacultyDocument extends IFaculty, Document {}

const FacultySchema = new Schema<IFacultyDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    facultyCode: {
      type: String,
      required: [true, 'Faculty code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    designation: {
      type: String,
      default: 'Faculty',
      trim: true,
    },
    specialization: {
      type: String,
      default: '',
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
   qualifications: [
  {
    certificateType: { type: String, default: 'Certificate' },  // Degree, Conference, Workshop, FDP, etc.
    title: { type: String, default: '' },                        // Full title
    issuedBy: { type: String, default: '' },                     // Who issued it
    eventName: { type: String, default: '' },                    // Event/Conference name
    place: { type: String, default: '' },                        // Venue/Location
    year: { type: Number, default: new Date().getFullYear() },   // Year
    duration: { type: String, default: '' },                     // Duration
    specialization: { type: String, default: '' },               // Topic/Subject
    organizer: { type: String, default: '' },                    // Organizing body
    certificateNumber: { type: String, default: '' },            // Certificate/Reg number
    certificateFile: { type: String, default: '' },              // Base64 file
    certificateFileName: { type: String, default: '' },          // Original filename
    verified: { type: Boolean, default: false },                 // Verification status
    uploadedAt: { type: Date, default: Date.now },               // Upload date
  },
],
    publications: [
      {
        title: { type: String },
        journal: { type: String },
        year: { type: Number },
        doi: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook - Mongoose 9 syntax (no next needed)
FacultySchema.pre('save', function () {
  // Capitalize first letter of names
  if (this.isModified('firstName') && this.firstName) {
    this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase();
  }
  if (this.isModified('lastName') && this.lastName) {
    this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1).toLowerCase();
  }
});

// Indexes for faster queries
FacultySchema.index({ department: 1 });
FacultySchema.index({ status: 1 });
FacultySchema.index({ facultyCode: 1 });
FacultySchema.index({ email: 1 });

const Faculty = mongoose.models.Faculty || mongoose.model<IFacultyDocument>('Faculty', FacultySchema);

export default Faculty;