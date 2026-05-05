// app/api/faculty/certificates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';
import { verifyToken } from '@/lib/auth';
import { analyzeCertificate } from '@/lib/certificate-parser';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const formData = await request.formData();
    const file = formData.get('certificate') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('=== UPLOAD START ===');
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes');

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);
    
    // Convert to base64
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    console.log('Base64 length:', base64String.length);
    
    // Create data URL
    const dataUrl = `data:${file.type};base64,${base64String}`;
    console.log('Data URL starts with:', dataUrl.substring(0, 60));
    console.log('Data URL total length:', dataUrl.length);

    // Analyze certificate
    let extractedData;
    try {
      extractedData = await analyzeCertificate(Buffer.from(arrayBuffer), file.name);
    } catch (e) {
      console.log('Analysis failed, using defaults');
      extractedData = {
        certificateType: 'Certificate',
        title: file.name,
        issuedBy: 'Unknown',
        eventName: '',
        place: '',
        year: new Date().getFullYear(),
        duration: '',
        specialization: '',
        organizer: '',
        certificateNumber: '',
      };
    }

    // Find faculty
    const faculty = await Faculty.findOne({ userId: decoded.userId });
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Create certificate object
    const newCertificate = {
      certificateType: extractedData.certificateType || 'Certificate',
      title: extractedData.title || file.name,
      issuedBy: extractedData.issuedBy || 'Unknown',
      eventName: extractedData.eventName || '',
      place: extractedData.place || '',
      year: extractedData.year || new Date().getFullYear(),
      duration: extractedData.duration || '',
      specialization: extractedData.specialization || '',
      organizer: extractedData.organizer || '',
      certificateNumber: extractedData.certificateNumber || '',
      certificateFile: dataUrl,
      certificateFileName: file.name,
      verified: false,
      uploadedAt: new Date(),
    };

    // Add to faculty
    faculty.qualifications.push(newCertificate as any);
    await faculty.save();

    console.log('=== UPLOAD SUCCESS ===');
    console.log('Certificate saved with file length:', dataUrl.length);

    return NextResponse.json({
      message: 'Certificate uploaded',
      certificate: newCertificate,
      extracted: extractedData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload';
    console.error('=== UPLOAD ERROR ===', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const faculty = await Faculty.findOne({ userId: decoded.userId });
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    const certificates = (faculty.qualifications || []).map((cert: any) => ({
      _id: cert._id,
      certificateType: cert.certificateType || 'Certificate',
      title: cert.title || 'Untitled',
      issuedBy: cert.issuedBy || '',
      eventName: cert.eventName || '',
      place: cert.place || '',
      year: cert.year || '',
      duration: cert.duration || '',
      specialization: cert.specialization || '',
      organizer: cert.organizer || '',
      certificateNumber: cert.certificateNumber || '',
      certificateFile: cert.certificateFile || '',
      certificateFileName: cert.certificateFileName || '',
      verified: cert.verified || false,
      uploadedAt: cert.uploadedAt || '',
    }));

    return NextResponse.json({ certificates });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}