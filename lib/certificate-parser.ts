// lib/certificate-parser.ts

export interface CertificateData {
  certificateType: string;  // Degree, Conference, Workshop, Seminar, FDP, etc.
  title: string;            // Full title of the certificate
  issuedBy: string;         // Who issued the certificate
  eventName: string;        // Conference/FDP/Workshop name
  place: string;            // Venue/Location
  year: number;             // Year
  duration: string;         // Duration (e.g., "5 days", "1 week")
  specialization: string;   // Topic/Subject
  organizer: string;        // Organizing body
  certificateNumber: string;// Certificate/Registration number
}

// Comprehensive certificate parser for ALL types
export function parseCertificateText(text: string): CertificateData {
  const data: CertificateData = {
    certificateType: '',
    title: '',
    issuedBy: '',
    eventName: '',
    place: '',
    year: new Date().getFullYear(),
    duration: '',
    specialization: '',
    organizer: '',
    certificateNumber: '',
  };

  if (!text || text.trim().length === 0) return data;

  // 1. DETECT CERTIFICATE TYPE
  if (/degree|bachelor|master|doctor|phd|ph\.d|diploma|graduation|convocation/i.test(text)) {
    data.certificateType = 'Degree';
  } else if (/conference|symposium|summit|meet/i.test(text)) {
    data.certificateType = 'Conference';
  } else if (/workshop/i.test(text)) {
    data.certificateType = 'Workshop';
  } else if (/seminar|webinar/i.test(text)) {
    data.certificateType = 'Seminar';
  } else if (/fdp|faculty development|development program/i.test(text)) {
    data.certificateType = 'FDP';
  } else if (/training|internship|bootcamp/i.test(text)) {
    data.certificateType = 'Training';
  } else if (/course|online|mooc|coursera|udemy|edx|nptel|swayam/i.test(text)) {
    data.certificateType = 'Online Course';
  } else if (/hackathon|coding|competition/i.test(text)) {
    data.certificateType = 'Competition';
  } else if (/quiz|exam|test/i.test(text)) {
    data.certificateType = 'Quiz/Exam';
  } else if (/participation|attended|present/i.test(text)) {
    data.certificateType = 'Participation';
  } else {
    data.certificateType = 'Certificate';
  }

  // 2. EXTRACT TITLE
  const titlePatterns = [
    // Conference/Workshop titles
    /(?:conference|workshop|seminar|symposium|fdp|training)\s*(?:on|titled|:|–|-)\s*["""]?([A-Za-z0-9\s\-&,:'()]+)["""]?/i,
    // Degree titles
    /(?:Bachelor|Master|Doctor|PhD|Ph\.D|Diploma)\s*(?:of|in)\s*([A-Za-z\s]+)/i,
    // Course titles
    /(?:course|program)\s*(?:on|titled|:)\s*["""]?([A-Za-z0-9\s\-&,:'()]+)["""]?/i,
    // Any title in quotes
    /["""]([A-Za-z0-9\s\-&,:'()]{10,})["""]/,
    // Title line (all caps)
    /^([A-Z][A-Z\s]{10,})$/m,
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 5) {
      data.title = match[1].trim();
      break;
    }
  }

  // 3. EXTRACT ISSUED BY
  const issuerPatterns = [
    /(?:issued|certified|awarded|presented)\s*(?:by|from)\s*([A-Za-z\s.,&()]+?)(?:\n|\.|,|dated)/i,
    /([A-Za-z\s.,&()]+)\s*(?:University|College|Institute|School|Academy|Organization|Society|Association)/i,
    /(?:University|College|Institute|School|Organization)\s*(?:of|for)?\s*([A-Za-z\s.,&]+)/i,
    /from\s+([A-Za-z\s.,&()]{5,}?)(?:\n|\.|,)/i,
  ];

  for (const pattern of issuerPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      data.issuedBy = match[1].trim();
      break;
    }
  }

  // 4. EXTRACT EVENT NAME
  const eventPatterns = [
    /(?:conference|workshop|seminar|symposium|fdp|summit|training)\s*(?:on|titled|:)\s*([A-Za-z0-9\s\-&,:'()]+)/i,
    /([A-Za-z0-9\s\-&,:'()]+)\s*(?:Conference|Workshop|Seminar|Symposium|FDP|Summit)/i,
    /event\s*(?:name|title)?\s*:?\s*([A-Za-z0-9\s\-&,:'()]+)/i,
  ];

  for (const pattern of eventPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      data.eventName = match[1].trim();
      break;
    }
  }

  // 5. EXTRACT PLACE
  const placePatterns = [
    /(?:at|in|venue|location|place|held at|organized at)\s*:?\s*([A-Za-z\s,]+?)(?:\n|\.|,|on|dated|from)/i,
    /([A-Za-z\s]+),\s*(?:India|Tamil\s*Nadu|Kerala|Karnataka|Maharashtra|Delhi|Gujarat)/i,
    /(?:Chennai|Mumbai|Delhi|Bangalore|Kolkata|Hyderabad|Pune|Ahmedabad|Jaipur|Lucknow|Coimbatore|Madurai|Trichy|Salem|Tirunelveli)/i,
  ];

  for (const pattern of placePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.place = match[0].trim();
      break;
    }
  }

  // 6. EXTRACT YEAR
  const yearMatches = text.match(/20\d{2}/g);
  if (yearMatches) {
    for (const y of yearMatches) {
      const year = parseInt(y);
      if (year >= 1990 && year <= 2030) {
        data.year = year;
        break;
      }
    }
  }

  // 7. EXTRACT DURATION
  const durationPatterns = [
    /(\d+)\s*(?:days?|weeks?|months?|hours?)/i,
    /(?:duration|period)\s*:?\s*([A-Za-z0-9\s]+)/i,
    /(?:from|between)\s*([A-Za-z0-9\s]+)\s*(?:to|–|-)\s*([A-Za-z0-9\s]+)/i,
  ];

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.duration = match[0].trim();
      break;
    }
  }

  // 8. EXTRACT SPECIALIZATION/TOPIC
  const topicPatterns = [
    /(?:on|topic|subject|theme|area|field|domain)\s*(?:of\s+)?["""]?([A-Za-z\s&]+?)(?:\.|,|\n|at|held|organized)/i,
    /([A-Za-z\s]+)\s*(?:Engineering|Technology|Science|Management|Studies)/i,
  ];

  for (const pattern of topicPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      data.specialization = match[1].trim();
      break;
    }
  }

  // 9. EXTRACT ORGANIZER
  const organizerPatterns = [
    /(?:organized|conducted|coordinated|hosted)\s*(?:by|through)\s*([A-Za-z\s.,&()]+?)(?:\n|\.|,)/i,
    /organizer\s*:?\s*([A-Za-z\s.,&()]+)/i,
    /department\s*(?:of|in)?\s*([A-Za-z\s.,&()]+)/i,
  ];

  for (const pattern of organizerPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      data.organizer = match[1].trim();
      break;
    }
  }

  // 10. EXTRACT CERTIFICATE NUMBER
  const certNumPatterns = [
    /(?:certificate|registration|enrollment|reference)\s*(?:no|number|#|:)?\s*:?\s*([A-Za-z0-9\-\/]+)/i,
    /(?:reg|cert|ref)\s*(?:no|number)?\s*:?\s*([A-Za-z0-9\-\/]+)/i,
  ];

  for (const pattern of certNumPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      data.certificateNumber = match[1].trim();
      break;
    }
  }

  return data;
}

export async function analyzeCertificate(fileBuffer: Buffer, fileName: string): Promise<CertificateData> {
  let text = '';

  // Clean filename
  text = fileName
    .replace(/\.(pdf|jpg|jpeg|png|webp)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();

  // Extract text from buffer
  try {
    const sampleText = fileBuffer.toString('utf-8').substring(0, 3000);
    const readable = sampleText.replace(/[^\x20-\x7E\s\n]/g, '');
    if (readable.length > 50) {
      text = readable + '\n' + text;
    }
  } catch {
    // Ignore
  }

  console.log('📄 Parsing text (first 400 chars):', text.substring(0, 400));
  
  const result = parseCertificateText(text);
  console.log('🤖 Extracted:', JSON.stringify(result, null, 2));
  
  return result;
}