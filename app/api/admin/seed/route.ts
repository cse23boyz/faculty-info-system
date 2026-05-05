// app/api/admin/seed/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function GET() {
  try {
    await dbConnect();

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin already exists',
        admin: {
          username: existingAdmin.username,
          email: existingAdmin.email,
        },
      });
    }

    // Create default admin
    const admin = await Admin.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@jacsice.edu',
    });

    return NextResponse.json({
      message: 'Admin created successfully',
      admin: {
        username: admin.username,
        email: admin.email,
      },
      credentials: {
        username: 'admin',
        password: 'admin123',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}