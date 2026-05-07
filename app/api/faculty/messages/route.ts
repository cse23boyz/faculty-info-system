// app/api/faculty/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import Faculty from '@/models/Faculty';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Get messages/conversations
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
    const contactId = searchParams.get('contactId');

    // If contactId provided, get conversation with that specific user
    if (contactId) {
      const messages = await Message.find({
        $or: [
          { sender: decoded.userId, receiver: contactId },
          { sender: contactId, receiver: decoded.userId },
        ],
      })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();

      // Mark messages as read
      await Message.updateMany(
        { sender: contactId, receiver: decoded.userId, read: false },
        { $set: { read: true } }
      );

      return NextResponse.json({ messages });
    }

    // Get all unique conversations
    // Find all messages where current user is sender or receiver
    const allMessages = await Message.find({
      $or: [
        { sender: decoded.userId },
        { receiver: decoded.userId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group by conversation partner
    const conversationMap = new Map();

    for (const msg of allMessages) {
      const partnerId = msg.sender.toString() === decoded.userId 
        ? msg.receiver.toString() 
        : msg.sender.toString();

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          userId: partnerId,
          lastMessage: msg.message,
          lastMessageDate: msg.createdAt,
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (msg.receiver.toString() === decoded.userId && !msg.read) {
        const conv = conversationMap.get(partnerId);
        if (conv) conv.unreadCount++;
      }
    }

    // Convert map to array
    const conversations = Array.from(conversationMap.values());

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        try {
          const faculty = await Faculty.findOne({ userId: conv.userId })
            .select('firstName lastName email department profilePhoto')
            .lean();

          return {
            ...conv,
            user: faculty ? {
              name: `${faculty.firstName} ${faculty.lastName}`,
              email: faculty.email,
              department: faculty.department || '',
              profilePhoto: faculty.profilePhoto || '',
            } : {
              name: 'Unknown User',
              email: '',
              department: '',
              profilePhoto: '',
            },
          };
        } catch {
          return {
            ...conv,
            user: { name: 'Unknown', email: '', department: '', profilePhoto: '' },
          };
        }
      })
    );

    // Sort by most recent message
    populatedConversations.sort((a, b) => {
      return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
    });

    return NextResponse.json({ conversations: populatedConversations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load messages';
    console.error('Messages error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Send message
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const body: { receiverId: string; message: string } = await request.json();
    const { receiverId, message } = body;

    if (!receiverId || !message || !message.trim()) {
      return NextResponse.json(
        { error: 'Receiver and message are required' },
        { status: 400 }
      );
    }

    const newMessage = await Message.create({
      sender: decoded.userId,
      receiver: receiverId,
      message: message.trim(),
      read: false,
    });

    return NextResponse.json({
      message: 'Message sent',
      data: {
        _id: newMessage._id,
        sender: decoded.userId,
        receiver: receiverId,
        message: newMessage.message,
        read: false,
        createdAt: newMessage.createdAt,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send';
    console.error('Send error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}