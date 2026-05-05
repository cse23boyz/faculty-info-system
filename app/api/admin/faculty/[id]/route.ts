// app/api/admin/faculty/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';
import User from '@/models/User';

// DELETE - Remove faculty from local DB only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    // Find faculty record
    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    faculty.status = 'inactive';
    await faculty.save();

    return NextResponse.json({
      message: 'Faculty removed from local database (marked as inactive)',
      note: 'Faculty still exists in Master DB',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove faculty';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PUT - Restore faculty
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const faculty = await Faculty.findByIdAndUpdate(
      id,
      { status: 'active' },
      { new: true }
    );

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Faculty restored successfully',
      data: faculty,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to restore faculty';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}