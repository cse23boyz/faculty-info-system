// app/api/debug/users/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    
    const users = await User.find({}, { name: 1, email: 1, role: 1, department: 1 });
    
    return NextResponse.json({
      count: users.length,
      users: users,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}