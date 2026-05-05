// app/api/faculty/profile-check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
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

    const faculty = await Faculty.findOne({ userId: decoded.userId });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Check if profile is complete
    // Department must NOT be 'General' AND designation must NOT be 'Faculty'
    const isComplete = 
      faculty.department !== 'General' && 
      faculty.department !== '' &&
      faculty.designation !== 'Faculty' && 
      faculty.designation !== '';

    console.log('Profile check:', {
      department: faculty.department,
      designation: faculty.designation,
      isComplete: isComplete,
    });

    return NextResponse.json({
      isComplete,
      faculty: {
        id: faculty._id,
        department: faculty.department,
        designation: faculty.designation,
        phone: faculty.phone,
        profilePhoto: faculty.profilePhoto || '',
      },
    });
  } catch (error: unknown) {
    console.error('Profile check error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}