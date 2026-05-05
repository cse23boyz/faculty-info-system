// models/Department.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  head: mongoose.Types.ObjectId;
  description: string;
  established: number;
  facultyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
    },
    head: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    description: {
      type: String,
      default: '',
    },
    established: {
      type: Number,
    },
    facultyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);