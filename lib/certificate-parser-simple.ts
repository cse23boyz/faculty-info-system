// lib/certificate-parser-simple.ts

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
  confidence?: number;
  rawText?: string;
}

export function parseCertificateText(text: string): CertificateData {
  const data: CertificateData = {
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
  };

  if (!text || text.trim().length < 5) return data;

  // Basic parsing for fallback
  const lines = text.split('\n').filter(l => l.trim());
  
  // Try to find title (longest uppercase line)
  const upperLines = lines.filter(l => /^[A-Z\s]{10,}$/.test(l.trim()));
  if (upperLines.length > 0) {
    data.title = upperLines[0].trim();
  }

  // Find name patterns
  const nameMatch = text.match(/(?:to|certify that)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (nameMatch) data.recipientName = nameMatch[1].trim();

  // Find year
  const yearMatch = text.match(/20\d{2}/);
  if (yearMatch) data.year = parseInt(yearMatch[0]);

  // Find organization
  const orgMatch = text.match(/([A-Z][A-Za-z&]+\s+(?:University|College|Institute|Digital|Technologies|Solutions|Services|Company|Organization))/i);
  if (orgMatch) data.issuedBy = orgMatch[1].trim();

  return data;
}