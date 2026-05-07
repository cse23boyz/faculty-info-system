// app/api/faculty/contacts/route.ts
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const query: any = {
      userId: { $ne: decoded.userId }, // Exclude current user
      status: 'active',
    };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const faculty = await Faculty.find(query)
      .select('firstName lastName email department profilePhoto userId')
      .limit(50);

    return NextResponse.json({
      contacts: faculty.map(f => ({
        userId: f.userId,
        name: `${f.firstName} ${f.lastName}`,
        email: f.email,
        department: f.department,
        profilePhoto: f.profilePhoto,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}