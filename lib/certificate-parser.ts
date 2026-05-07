// lib/certificate-parser.ts
import { ocrSpaceExtract } from './ocr-space';

export interface CertificateData {
  certificateType: string;
  title: string;
  issuedBy: string;
  eventName: string;
  place: string;
  year: number;
  duration: string;
  specialization: string;
  organizer: string;
  certificateNumber: string;
  recipientName: string;
  fromDate: string;
  toDate: string;
  dateOfIssue: string;
  confidence: number;
  rawText: string;
}

// ==================== PDF TEXT EXTRACTION ====================
function extractPDFText(buffer: Buffer): string {
  try {
    const rawText = buffer.toString('utf-8').substring(0, 10000);
    const readable = rawText
      .replace(/[^\x20-\x7E\s\n]/g, '')
      .replace(/image\[\[.*?\]\]/g, '')
      .replace(/={2,}.*?={2,}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return readable;
  } catch {
    return '';
  }
}

// ==================== FILE TYPE CHECKS ====================
function isImage(fileName: string): boolean {
  return /\.(png|jpg|jpeg|webp|bmp|tiff)$/i.test(fileName);
}

function isPDF(fileName: string): boolean {
  return /\.pdf$/i.test(fileName);
}

function hasReadablePDFText(text: string): boolean {
  const garbagePatterns = ['PNG', 'IHDR', 'IDAT', 'IEND', 'JFIF', 'Exif', 'RIFF'];
  const hasGarbage = garbagePatterns.some(p => text.includes(p));
  const hasWords = /\b[A-Za-z]{3,}\b/.test(text);
  return !hasGarbage && hasWords && text.length > 100;
}

// ==================== TEXT PARSING ====================
function parseText(text: string): CertificateData {
  const result: CertificateData = {
    certificateType: 'Certificate',
    title: '',
    issuedBy: '',
    eventName: '',
    place: '',
    year: new Date().getFullYear(),
    duration: '',
    specialization: '',
    organizer: '',
    certificateNumber: '',
    recipientName: '',
    fromDate: '',
    toDate: '',
    dateOfIssue: '',
    confidence: 0,
    rawText: text,
  };

  if (!text || text.trim().length < 5) return result;

  let matchCount = 0;
  const totalFields = 10;

  // 1. Certificate Type
  if (/internship/i.test(text)) { result.certificateType = 'Internship'; matchCount++; }
  else if (/(?:bachelor|master|doctor|phd|ph\.d|diploma|degree|graduation|convocation)/i.test(text)) { result.certificateType = 'Degree'; matchCount++; }
  else if (/(?:conference|symposium|summit)/i.test(text)) { result.certificateType = 'Conference'; matchCount++; }
  else if (/workshop/i.test(text)) { result.certificateType = 'Workshop'; matchCount++; }
  else if (/seminar|webinar/i.test(text)) { result.certificateType = 'Seminar'; matchCount++; }
  else if (/fdp|faculty development/i.test(text)) { result.certificateType = 'FDP'; matchCount++; }
  else if (/training/i.test(text)) { result.certificateType = 'Training'; matchCount++; }
  else if (/course|online|mooc|coursera|udemy|nptel|swayam/i.test(text)) { result.certificateType = 'Online Course'; matchCount++; }
  else if (/competition|contest|hackathon/i.test(text)) { result.certificateType = 'Competition'; matchCount++; }
  else if (/participation|attended|presented/i.test(text)) { result.certificateType = 'Participation'; matchCount++; }
  else if (/completion|completed/i.test(text)) { result.certificateType = 'Completion'; matchCount++; }

  // 2. Title
  const titlePatterns = [
    /CERTIFICATE\s+OF\s+([A-Z\s\-]+)/i,
    /(?:certificate|diploma|award)\s+(?:of|in|for)\s+([A-Za-z\s\-&,'()]+)/i,
    /^([A-Z][A-Z\s\-&,'()]{8,})$/m,
    /INTERNSHIP\s+(?:COMPLETION|PROGRAM|CERTIFICATE)/i,
    /(?:INTERNSHIP|TRAINING|WORKSHOP|COURSE)\s+(?:COMPLETION|CERTIFICATE|PROGRAM)/i,
  ];

  for (const p of titlePatterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].trim().length > 3) { result.title = m[1].trim(); matchCount++; break; }
  }

  if (!result.title) {
    const titleMatch = text.match(/(CERTIFICATE\s+OF\s+[A-Z\s]+|INTERNSHIP\s+(?:COMPLETION|PROGRAM)|[A-Z][A-Z\s\-]{10,})/i);
    if (titleMatch) { result.title = titleMatch[1].trim(); matchCount++; }
  }

  // 3. Recipient Name
  const namePatterns = [
    /(?:certify that|certifies that|awarded to|presented to)\s+(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+has\s+(?:successfully\s+)?(?:completed|passed|achieved|finished)/i,
    /(?:appreciate|congratulate|wish)\s+([A-Z][a-z]+(?:'s)?(?:\s+[A-Z][a-z]+){0,2})/i,
  ];

  for (const p of namePatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      let name = m[1].trim().replace(/'s$/, '');
      if (!/(?:certificate|university|college|institute|department|school|program|limited|private|digital|marketing|technology)/i.test(name)) {
        result.recipientName = name; matchCount++; break;
      }
    }
  }

  // 4. Organization/Issued By
  const orgPatterns = [
    /(?:with|at|from)\s+([A-Z][A-Za-z\s&.,'\-]+?)(?:\s+(?:from|for|dated|\.|,|\n|during|Director))/i,
    /([A-Z][A-Za-z\s&.,'\-]+)\s+(?:Director|Founder|CEO|President|Principal|Head)/i,
    /([A-Z][A-Za-z&]+(?:\s+[A-Z][A-Za-z&]+){1,4})\s*(?:Digital|Marketing|Technologies|Solutions|Services|Consulting|Academy|Institute|University|College)/i,
    /Thanks\s*(?:&|and)?\s*Regards?,?\s*\n+([A-Za-z\s]+)\n+(?:Director|Founder)/i,
  ];

  for (const p of orgPatterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].trim().length > 3) {
      const org = m[1].trim();
      if (!/(?:certificate|completion|internship|training|student|candidate|participant)/i.test(org)) {
        result.issuedBy = org; matchCount++; break;
      }
    }
  }

  // 5. Dates
  const dates: string[] = [];
  const dateRegex = /(\d{1,2}[\s\-./]*\d{1,2}[\s\-./]*\d{2,4})/g;
  let dm;
  while ((dm = dateRegex.exec(text)) !== null) {
    if (dm[1]) dates.push(dm[1].trim());
  }

  const rangeMatch = text.match(/(?:from|between)\s+([\d\s\-./]+?)\s+(?:to|till|until|–|-)\s+([\d\s\-./]+)/i);
  if (rangeMatch) {
    result.fromDate = rangeMatch[1].trim();
    result.toDate = rangeMatch[2].trim();
    matchCount++;
  } else if (dates.length >= 2) {
    result.fromDate = dates[0];
    result.toDate = dates[dates.length - 1];
    matchCount++;
  }

  const issueMatch = text.match(/(?:date|dated|issued|awarded)\s*:?\s*(\d{1,2}[\s\-./]*\d{1,2}[\s\-./]*\d{2,4})/i);
  if (issueMatch) { result.dateOfIssue = issueMatch[1].trim(); matchCount++; }
  else if (dates.length > 0) { result.dateOfIssue = dates[dates.length - 1]; matchCount++; }

  // 6. Duration
  const durPatterns = [/(\d+)\s*(?:days?|weeks?|months?)/i, /(?:duration|period)\s*:?\s*([\w\s]+)/i];
  for (const p of durPatterns) {
    const m = text.match(p);
    if (m) { result.duration = m[1].trim(); matchCount++; break; }
  }

  if (!result.duration && result.fromDate && result.toDate) {
    try {
      const pd = (d: string) => {
        const parts = d.split(/[\s\-./]+/);
        return new Date(
          parseInt(parts[2]?.length === 2 ? '20' + parts[2] : parts[2] || '2024'),
          parseInt(parts[1] || '1') - 1,
          parseInt(parts[0] || '1')
        );
      };
      const d1 = pd(result.fromDate), d2 = pd(result.toDate);
      if (d2 > d1) {
        const diff = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
        if (diff >= 60) result.duration = `${Math.round(diff / 30)} months`;
        else if (diff >= 14) result.duration = `${Math.round(diff / 7)} weeks`;
        else result.duration = `${diff} days`;
        matchCount++;
      }
    } catch {}
  }

  // 7. Year
  const ym = text.match(/20\d{2}/);
  if (ym) { result.year = parseInt(ym[0]); matchCount++; }

  // 8. Specialization/Topics
  const specPatterns = [
    /(digital marketing|web (?:design|development)|video editing|content creation|graphic design|data (?:science|analytics)|machine learning|artificial intelligence|cybersecurity|blockchain|cloud computing|full stack|mobile (?:app\s+)?development|python|java|react|node|angular|flutter|devops|ui\/?ux|seo|smm|social media|email marketing|wordpress|shopify)[\w\s,&]*/i,
    /(?:involved|covered|included|topics?|areas?)\s*:?\s*([A-Za-z\s,&]+?)(?:\.|$|\n)/i,
  ];

  for (const p of specPatterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].trim().length > 3) { result.specialization = m[1].trim(); matchCount++; break; }
  }

  // 9. Certificate Number
  const cnMatch = text.match(/(?:certificate|registration|enrollment|reference|serial|ref)\s*(?:no|number|#|:)?\s*:?\s*([A-Za-z0-9\-\/]{3,})/i);
  if (cnMatch) { result.certificateNumber = cnMatch[1].trim(); matchCount++; }

  // 10. Organizer
  const orgMatch = text.match(/(?:Director|Founder|Head|Manager|Coordinator)\s*(?:&|and)?\s*(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i);
  if (orgMatch && orgMatch[1]) { result.organizer = orgMatch[1].trim(); matchCount++; }

  result.confidence = Math.round((matchCount / totalFields) * 100);
  return result;
}

// ==================== MAIN ANALYZER ====================
export async function analyzeCertificate(
  fileBuffer: Buffer,
  fileName: string
): Promise<CertificateData> {
  console.log('='.repeat(50));
  console.log('🔍 CERTIFICATE ANALYSIS STARTED');
  console.log('📁 File:', fileName);
  console.log('📏 Size:', (fileBuffer.length / 1024).toFixed(1), 'KB');
  console.log('='.repeat(50));

  console.time('total-analysis');
  let text = '';
  const fileType = fileName.toLowerCase();

  // STEP 1: PDF - Try direct text extraction (instant)
  if (isPDF(fileName)) {
    console.log('📄 PDF detected - trying direct extraction...');
    const pdfText = extractPDFText(fileBuffer);
    
    if (hasReadablePDFText(pdfText)) {
      console.log('✅ PDF text extracted directly:', pdfText.length, 'chars');
      text = pdfText;
    } else {
      console.log('📷 Scanned PDF - using OCR.space...');
      text = await ocrSpaceExtract(fileBuffer, fileName);
    }
  }
  
  // STEP 2: Image - Use OCR.space
  else if (isImage(fileName)) {
    console.log('🖼️ Image detected - using OCR.space API...');
    text = await ocrSpaceExtract(fileBuffer, fileName);
  }
  
  // STEP 3: Other formats
  else {
    console.log('📄 Unknown format - trying buffer text...');
    try {
      const rawText = fileBuffer.toString('utf-8').substring(0, 5000);
      const readable = rawText.replace(/[^\x20-\x7E\s\n]/g, '');
      if (readable.length > 50) text = readable;
    } catch {}
  }

  // STEP 4: Fallback - use filename
  if (text.length < 10) {
    text = fileName
      .replace(/\.(pdf|png|jpg|jpeg|webp|bmp|tiff)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
    console.log('⚠️ Using filename fallback:', text);
  }

  console.log('📄 Text for parsing:', text.length, 'characters');
  console.log('📄 Sample:', text.substring(0, 200));

  // STEP 5: Parse the text
  const result = parseText(text);
  
  console.timeEnd('total-analysis');
  console.log('🤖 RESULT:', {
    type: result.certificateType,
    title: result.title,
    name: result.recipientName,
    org: result.issuedBy,
    year: result.year,
    from: result.fromDate,
    to: result.toDate,
    confidence: result.confidence + '%',
  });
  console.log('='.repeat(50));

  return result;
}

// Export for backward compatibility
export function parseCertificateText(text: string): CertificateData {
  return parseText(text);
}