// app/api/faculty/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const department = searchParams.get('department') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filter: any = { status: 'active' };

    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { department: { $regex: query, $options: 'i' } },
        { specialization: { $regex: query, $options: 'i' } },
        { designation: { $regex: query, $options: 'i' } },
      ];
    }

    if (department) {
      filter.department = department;
    }

    const skip = (page - 1) * limit;

    const [facultyList, total] = await Promise.all([
      Faculty.find(filter)
        .select('firstName lastName email department designation specialization profilePhoto qualifications publications phone')
        .skip(skip)
        .limit(limit)
        .sort({ firstName: 1 }),
      Faculty.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: facultyList,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}