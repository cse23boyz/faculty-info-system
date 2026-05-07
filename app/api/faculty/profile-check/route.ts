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

    // Get FULL faculty data including qualifications
    const faculty = await Faculty.findOne({ userId: decoded.userId });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Check if profile is complete
    const isComplete = 
      faculty.department !== 'General' && 
      faculty.department !== '' &&
      faculty.designation !== 'Faculty' && 
      faculty.designation !== '';

    return NextResponse.json({
      isComplete,
      faculty: {
        _id: faculty._id,
        userId: faculty.userId,
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        email: faculty.email,
        phone: faculty.phone || '',
        department: faculty.department,
        designation: faculty.designation,
        specialization: faculty.specialization || '',
        profilePhoto: faculty.profilePhoto || '',
        facultyCode: faculty.facultyCode,
        status: faculty.status,
        qualifications: faculty.qualifications || [],
        publications: faculty.publications || [],
      },
    });
  } catch (error: unknown) {
    console.error('Profile check error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}