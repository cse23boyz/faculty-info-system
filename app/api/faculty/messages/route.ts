// app/api/faculty/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import Faculty from '@/models/Faculty';
import { verifyToken } from '@/lib/auth';

// GET - Get messages for current user
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

    if (contactId) {
      // Get conversation with specific contact
      const messages = await Message.find({
        $or: [
          { sender: decoded.userId, receiver: contactId },
          { sender: contactId, receiver: decoded.userId },
        ],
      })
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .sort({ createdAt: 1 })
        .limit(100);

      // Mark messages as read
      await Message.updateMany(
        { sender: contactId, receiver: decoded.userId, read: false },
        { $set: { read: true } }
      );

      return NextResponse.json({ messages });
    }

    // Get all conversations (latest message from each contact)
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: decoded.userId },
            { receiver: decoded.userId },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', decoded.userId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$message' },
          lastMessageDate: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', decoded.userId] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { lastMessageDate: -1 },
      },
    ]);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const user = await Faculty.findOne({ userId: conv._id })
          .select('firstName lastName email department profilePhoto');
        return {
          userId: conv._id,
          user: user ? {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            department: user.department,
            profilePhoto: user.profilePhoto,
          } : { name: 'Unknown', email: '', department: '', profilePhoto: '' },
          lastMessage: conv.lastMessage,
          lastMessageDate: conv.lastMessageDate,
          unreadCount: conv.unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: populatedConversations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Send a message
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

    if (!receiverId || !message) {
      return NextResponse.json(
        { error: 'Receiver and message are required' },
        { status: 400 }
      );
    }

    const newMessage = await Message.create({
      sender: decoded.userId,
      receiver: receiverId,
      message,
    });

    await newMessage.populate('sender', 'name email');
    await newMessage.populate('receiver', 'name email');

    return NextResponse.json({
      message: 'Message sent',
      data: newMessage,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}