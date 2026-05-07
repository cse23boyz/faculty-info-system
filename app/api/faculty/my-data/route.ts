// app/api/faculty/my-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Get ONLY current user's faculty data
    const faculty = await Faculty.findOne({ userId: decoded.userId });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Format certificates
    const certificatesFormatted = faculty.qualifications && faculty.qualifications.length > 0
      ? faculty.qualifications.map((q: any) =>
          `[${q.certificateType || 'Certificate'}] ${q.title || 'N/A'} | Issued: ${q.issuedBy || 'N/A'} | Year: ${q.year || 'N/A'}${q.place ? ' | Place: ' + q.place : ''}${q.duration ? ' | Duration: ' + q.duration : ''}`
        ).join('\n')
      : 'No certificates';

    // Format publications
    const publicationsFormatted = faculty.publications && faculty.publications.length > 0
      ? faculty.publications.map((p: any) =>
          `${p.title || 'N/A'} | Journal: ${p.journal || 'N/A'} | Year: ${p.year || 'N/A'}${p.doi ? ' | DOI: ' + p.doi : ''}`
        ).join('\n')
      : 'No publications';

    // Create Excel data
    const excelData = [{
      'Name': `${faculty.firstName} ${faculty.lastName}`,
      'Email': faculty.email,
      'Faculty Code': faculty.facultyCode,
      'Phone': faculty.phone || 'N/A',
      'Department': faculty.department,
      'Designation': faculty.designation,
      'Specialization': faculty.specialization || 'N/A',
      'Status': faculty.status,
      'Certificates': certificatesFormatted,
      'Publications': publicationsFormatted,
      'Total Certificates': faculty.qualifications?.length || 0,
      'Total Publications': faculty.publications?.length || 0,
      'Joined Date': faculty.joiningDate ? new Date(faculty.joiningDate).toLocaleDateString('en-IN') : 'N/A',
      'Exported On': new Date().toLocaleDateString('en-IN'),
    }];

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
      { wch: 35 }, { wch: 25 }, { wch: 25 }, { wch: 12 },
      { wch: 60 }, { wch: 50 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'My Faculty Data');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `My-Faculty-Data-${faculty.firstName}-${faculty.lastName}-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}