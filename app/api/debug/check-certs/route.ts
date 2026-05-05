// app/api/debug/check-certs/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';

export async function GET() {
  try {
    await dbConnect();

    const allFaculty = await Faculty.find({});

    const result = allFaculty.map((faculty: any) => ({
      name: `${faculty.firstName} ${faculty.lastName}`,
      email: faculty.email,
      certificatesCount: faculty.qualifications?.length || 0,
      certificates: faculty.qualifications?.map((cert: any) => ({
        id: cert._id,
        title: cert.title,
        certificateType: cert.certificateType,
        hasFile: !!cert.certificateFile,
        fileStartsWith: cert.certificateFile ? cert.certificateFile.substring(0, 60) : 'NO FILE',
        fileLength: cert.certificateFile ? cert.certificateFile.length : 0,
        fileName: cert.certificateFileName,
      })),
    }));

    return NextResponse.json({
      totalFaculty: allFaculty.length,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}