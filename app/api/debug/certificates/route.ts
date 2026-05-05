// app/api/debug/certificates/route.ts
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
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Return certificates with file info (truncated)
    const certs = faculty.qualifications.map((cert: any) => ({
      _id: cert._id,
      title: cert.title,
      certificateType: cert.certificateType,
      hasFile: !!cert.certificateFile,
      fileType: cert.certificateFile ? cert.certificateFile.substring(0, 50) + '...' : 'none',
      fileLength: cert.certificateFile ? cert.certificateFile.length : 0,
      certificateFileName: cert.certificateFileName,
    }));

    return NextResponse.json({
      total: certs.length,
      certificates: certs,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}