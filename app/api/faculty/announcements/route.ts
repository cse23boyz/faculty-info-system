// app/api/faculty/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import Faculty from '@/models/Faculty';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Get faculty info
    const faculty = await Faculty.findOne({ userId: decoded.userId });
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Find announcements that apply to this faculty
    const announcements = await Announcement.find({
      $or: [
        { broadcastType: 'all' }, // Broadcast to all
        { 
          broadcastType: 'department', 
          targetDepartments: faculty.department // Faculty's department
        },
        { 
          broadcastType: 'specific', 
          targetFaculty: faculty._id // Specifically this faculty
        },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(50);

    return NextResponse.json({ announcements });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}