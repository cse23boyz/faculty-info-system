// app/api/faculty/update-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const body: {
      department: string;
      designation: string;
      phone: string;
      profilePhoto: string;
    } = await request.json();

    const { department, designation, phone, profilePhoto } = body;

    if (!department || !designation) {
      return NextResponse.json(
        { error: 'Department and designation are required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {
      department,
      designation,
      phone: phone || '',
    };

    if (profilePhoto) {
      updateData.profilePhoto = profilePhoto;
    }

    console.log('Updating faculty profile:', {
      userId: decoded.userId,
      updateData,
    });

    const faculty = await Faculty.findOneAndUpdate(
      { userId: decoded.userId },
      { $set: updateData },
      { new: true }
    );

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    console.log('Updated faculty:', {
      id: faculty._id,
      department: faculty.department,
      designation: faculty.designation,
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      success: true,
      faculty: {
        id: faculty._id,
        department: faculty.department,
        designation: faculty.designation,
        phone: faculty.phone,
        profilePhoto: faculty.profilePhoto,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    console.error('Update error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}