// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Login API called');
    
    await dbConnect();
    console.log('✅ DB Connected');

    const body: { email: string; password: string } = await request.json();
    const { email, password } = body;

    console.log('📧 Login attempt for:', email);

    if (!email || !password) {
      console.log('❌ Missing fields');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('🔍 User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      // Check all users
      const allUsers = await User.find({}, { email: 1, name: 1, role: 1 });
      console.log('👥 All users in DB:', JSON.stringify(allUsers));
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('👤 User details:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('🔑 Password match:', isMatch);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    console.log('✅ Login successful for:', user.email);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('❌ Login error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}