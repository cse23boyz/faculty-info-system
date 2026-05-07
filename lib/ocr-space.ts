// lib/ocr-space.ts

// Free OCR.space API key (limited to 500 requests/day)
const OCR_API_KEY = 'K86774908888957'; // Free tier API key
const OCR_API_URL = 'https://api.ocr.space/parse/image';

interface OCRSpaceResponse {
  ParsedResults?: Array<{
    ParsedText: string;
    FileParseExitCode: number;
    ErrorMessage: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage: string;
  ProcessingTimeInMilliseconds: string;
}

/**
 * Extract text from image using OCR.space API
 * @param buffer - Image file buffer
 * @param fileName - Original file name with extension
 * @returns Extracted text string
 */
export async function ocrSpaceExtract(buffer: Buffer, fileName: string): Promise<string> {
  try {
    console.log('🔍 OCR.space: Starting extraction for', fileName);
    console.time('ocr-space');

    // Convert buffer to base64
    const base64 = buffer.toString('base64');

    // Determine file type from extension
    const ext = fileName.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                     ext === 'png' ? 'image/png' :
                     ext === 'webp' ? 'image/webp' :
                     ext === 'bmp' ? 'image/bmp' :
                     'image/png';

    // Prepare form data
    const formData = new FormData();
    formData.append('base64Image', `data:${mimeType};base64,${base64}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', ext.toUpperCase());
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 = better accuracy
    formData.append('apikey', OCR_API_KEY);

    // Call OCR.space API
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result: OCRSpaceResponse = await response.json();
    
    console.timeEnd('ocr-space');
    console.log('⏱️ Processing time:', result.ProcessingTimeInMilliseconds, 'ms');

    // Check for errors
    if (result.IsErroredOnProcessing || result.OCRExitCode !== 1) {
      console.error('OCR.space error:', result.ErrorMessage);
      return '';
    }

    // Extract text from results
    const extractedText = result.ParsedResults
      ?.map(r => r.ParsedText)
      .filter(Boolean)
      .join('\n') || '';

    console.log('✅ OCR.space extracted:', extractedText.length, 'characters');
    
    if (extractedText.length > 0) {
      console.log('📄 Sample:', extractedText.substring(0, 100));
    }

    return extractedText;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ OCR.space failed:', message);
    return '';
  }
}

/**
 * Quick check if OCR.space API is available
 */
export async function checkOCRSpaceStatus(): Promise<boolean> {
  try {
    const testBuffer = Buffer.from('test');
    const result = await ocrSpaceExtract(testBuffer, 'test.png');
    return true; // API responded
  } catch {
    return false;
  }
}