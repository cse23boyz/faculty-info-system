// app/api/admin/faculty/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';
import User from '@/models/User';
import { sendFacultyInviteEmail } from '@/lib/email-gmail';

// GET - Fetch all faculty
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { facultyCode: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

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
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch faculty';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Invite faculty with email
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body: { name: string; facultyCode: string; email: string } = await request.json();
    const { name, facultyCode, email } = body;

    if (!name || !facultyCode || !email) {
      return NextResponse.json(
        { error: 'Name, Faculty Code, and Email are required' },
        { status: 400 }
      );
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const username = `${firstName.toLowerCase()}${facultyCode.toLowerCase()}`;
    const password = generatePassword();

    // Check duplicates
    const existingFaculty = await Faculty.findOne({
      $or: [{ email }, { facultyCode }],
    });
    if (existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty with this email or faculty code already exists' },
        { status: 409 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user and faculty
    const user = await User.create({
      name,
      email,
      password,
      role: 'faculty',
      department: 'General',
    });

    const faculty = await Faculty.create({
      userId: user._id,
      employeeId: facultyCode,
      facultyCode,
      firstName,
      lastName,
      email,
      phone: '',
      department: 'General',
      designation: 'Faculty',
      specialization: '',
      status: 'active',
    });

    // Send email with credentials
    const emailResult = await sendFacultyInviteEmail({
      to: email,
      facultyName: name,
      username,
      password,
      facultyCode,
    });

    if (!emailResult.success) {
      console.warn('Faculty created but email failed:', emailResult.error);
    }

    return NextResponse.json(
      {
        message: emailResult.success
          ? 'Faculty invited and email sent successfully'
          : 'Faculty created but email failed to send',
        data: faculty,
        credentials: {
          name,
          email,
          username,
          password,
          facultyCode,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login/faculty`,
        },
        emailSent: emailResult.success,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to invite faculty';
    console.error('Invite error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}