// app/api/faculty/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faculty from '@/models/Faculty';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';

    // Build query
    const query: Record<string, unknown> = {};
    if (department) query.department = department;
    if (status) query.status = status;

    const facultyList = await Faculty.find(query)
      .select(
        'firstName lastName email phone department designation specialization status facultyCode qualifications publications joiningDate createdAt'
      )
      .sort({ firstName: 1 });

    // Prepare data for Excel
    const excelData = facultyList.map((faculty: any, index: number) => {
      // Format qualifications/certificates
      let certsFormatted = 'N/A';
      if (faculty.qualifications && faculty.qualifications.length > 0) {
        certsFormatted = faculty.qualifications
          .map(
            (q: any) =>
              `[${q.certificateType || 'Certificate'}] ${q.title || 'N/A'} | Issued by: ${q.issuedBy || 'N/A'} | Year: ${q.year || 'N/A'}${q.eventName ? ' | Event: ' + q.eventName : ''}${q.place ? ' | Place: ' + q.place : ''}${q.duration ? ' | Duration: ' + q.duration : ''}`
          )
          .join('\n');
      }

      // Format publications
      let pubsFormatted = 'N/A';
      if (faculty.publications && faculty.publications.length > 0) {
        pubsFormatted = faculty.publications
          .map(
            (p: any) =>
              `${p.title || 'N/A'} | Journal: ${p.journal || 'N/A'} | Year: ${p.year || 'N/A'}${p.doi ? ' | DOI: ' + p.doi : ''}`
          )
          .join('\n');
      }

      return {
        'S.No': index + 1,
        'Faculty Code': faculty.facultyCode || 'N/A',
        'Name': `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim(),
        'Email': faculty.email || 'N/A',
        'Phone': faculty.phone || 'N/A',
        'Department': faculty.department || 'N/A',
        'Designation': faculty.designation || 'N/A',
        'Specialization': faculty.specialization || 'N/A',
        'Status': faculty.status || 'N/A',
        'Certificates': certsFormatted,
        'Publications': pubsFormatted,
        'Joined Date': faculty.joiningDate
          ? new Date(faculty.joiningDate).toLocaleDateString('en-IN')
          : 'N/A',
        'Profile Created': faculty.createdAt
          ? new Date(faculty.createdAt).toLocaleDateString('en-IN')
          : 'N/A',
      };
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 6 },   // S.No
      { wch: 15 },  // Faculty Code
      { wch: 25 },  // Name
      { wch: 30 },  // Email
      { wch: 15 },  // Phone
      { wch: 35 },  // Department
      { wch: 25 },  // Designation
      { wch: 25 },  // Specialization
      { wch: 12 },  // Status
      { wch: 60 },  // Certificates
      { wch: 50 },  // Publications
      { wch: 15 },  // Joined Date
      { wch: 15 },  // Profile Created
    ];
    ws['!cols'] = colWidths;

    // Style header row
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2563EB' } },
      alignment: { horizontal: 'center' as const, vertical: 'center' as const },
    };

    // Apply header style
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = headerStyle;
      }
    }

    // Create workbook and add sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Data');

    // Add summary sheet
    const summaryData = [
      {
        'Total Faculty': facultyList.length,
        'Active': facultyList.filter((f: any) => f.status === 'active').length,
        'Inactive': facultyList.filter((f: any) => f.status === 'inactive').length,
        'On Leave': facultyList.filter((f: any) => f.status === 'on-leave').length,
        'Departments': [...new Set(facultyList.map((f: any) => f.department))].length,
        'Export Date': new Date().toLocaleDateString('en-IN'),
      },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `JACSICE-Faculty-Data-${date}.xlsx`;

    console.log(`📥 Export: ${facultyList.length} faculty records exported`);

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    console.error('Export error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}