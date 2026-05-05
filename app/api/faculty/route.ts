// app/api/faculty/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';

// GET - Fetch all faculty
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Build query
    const query: Record<string, string> = {};
    if (department) query.department = department;
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [facultyList, total] = await Promise.all([
      Faculty.find(query)
        .populate('userId', 'name email role')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Faculty.countDocuments(query),
    ]);

    return NextResponse.json({
      data: facultyList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch faculty data';
    console.error('Fetch faculty error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// POST - Create new faculty
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'employeeId', 'firstName', 'lastName', 'email', 'phone', 'department', 'designation'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check for duplicates
    const existingFaculty = await Faculty.findOne({
      $or: [{ email: body.email }, { employeeId: body.employeeId }],
    });
    
    if (existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty with this email or employee ID already exists' },
        { status: 409 }
      );
    }

    const faculty = await Faculty.create(body);
    
    return NextResponse.json(
      { message: 'Faculty created successfully', data: faculty },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create faculty';
    console.error('Create faculty error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}