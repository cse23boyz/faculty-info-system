// app/api/admin/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import Faculty from '@/models/Faculty';
import { verifyToken } from '@/lib/auth';

// POST - Create announcement
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const body: {
      title: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
      broadcastType: 'all' | 'department' | 'specific';
      targetDepartments: string[];
      targetFaculty: string[];
    } = await request.json();

    const { title, message, priority, broadcastType, targetDepartments, targetFaculty } = body;

    if (!title || !message || !broadcastType) {
      return NextResponse.json(
        { error: 'Title, message, and broadcast type are required' },
        { status: 400 }
      );
    }

    const announcement = await Announcement.create({
      title,
      message,
      priority: priority || 'medium',
      broadcastType,
      targetDepartments: targetDepartments || [],
      targetFaculty: targetFaculty || [],
      createdBy: decoded.userId,
    });

    return NextResponse.json({
      message: 'Announcement created successfully',
      announcement,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET - Get all announcements (for admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ announcements });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}