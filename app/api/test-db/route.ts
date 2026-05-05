import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: 'Connected to MongoDB successfully!' });
  } catch (error) {
    return NextResponse.json({ status: 'Error', message: (error as Error).message }, { status: 500 });
  }
}