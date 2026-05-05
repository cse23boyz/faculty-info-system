// models/Announcement.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement {
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  broadcastType: 'all' | 'department' | 'specific';
  targetDepartments: string[];
  targetFaculty: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncementDocument extends IAnnouncement, Document {}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    broadcastType: {
      type: String,
      enum: ['all', 'department', 'specific'],
      required: true,
    },
    targetDepartments: [{
      type: String,
    }],
    targetFaculty: [{
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Announcement = mongoose.models.Announcement || mongoose.model<IAnnouncementDocument>('Announcement', AnnouncementSchema);

export default Announcement;