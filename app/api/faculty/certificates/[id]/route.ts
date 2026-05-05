// app/api/faculty/certificates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';
import { verifyToken } from '@/lib/auth';

// DELETE - Remove a certificate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const { id } = await params;

    // Find faculty and remove the certificate by its _id
    const faculty = await Faculty.findOne({ userId: decoded.userId });
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Find certificate index
    const certIndex = faculty.qualifications.findIndex(
      (q: any) => q._id.toString() === id
    );

    if (certIndex === -1) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Remove certificate
    faculty.qualifications.splice(certIndex, 1);
    await faculty.save();

    return NextResponse.json({
      message: 'Certificate removed successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete certificate';
    console.error('Delete error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}