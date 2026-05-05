// app/api/debug/faculty/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';

export async function GET() {
  try {
    await dbConnect();
    
    const faculty = await Faculty.find({}, {
      firstName: 1,
      lastName: 1,
      email: 1,
      department: 1,
      designation: 1,
      status: 1,
    });
    
    return NextResponse.json({
      count: faculty.length,
      faculty: faculty.map(f => ({
        name: `${f.firstName} ${f.lastName}`,
        email: f.email,
        department: f.department,
        designation: f.designation,
        status: f.status,
        isComplete: f.department !== 'General' && f.designation !== 'Faculty',
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}