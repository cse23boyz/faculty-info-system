// app/api/faculty/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';

// GET - Fetch single faculty
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const faculty = await Faculty.findById(id).populate('userId', 'name email role');
    
    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: faculty });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch faculty';
    console.error('Fetch faculty error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PUT - Update faculty
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
    const faculty = await Faculty.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Faculty updated successfully',
      data: faculty,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update faculty';
    console.error('Update faculty error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// DELETE - Remove faculty
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const faculty = await Faculty.findByIdAndDelete(id);

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Faculty deleted successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete faculty';
    console.error('Delete faculty error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}