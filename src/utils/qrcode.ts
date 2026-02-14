import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { i18n, log } from '@/utils/sdk-helpers';

/**
 * Generate QR code as PDF with high-resolution PNG
 * @param data - Data to encode in QR code (deep link URL)
 * @param eventName - Event name (not used in minimalist design)
 * @returns Buffer containing PDF file
 */
export async function generateQRCodePDF(data: string, eventName: string): Promise<Buffer> {
  try {
    log.debug('Generating QR code PDF:', { data, eventName });

    // Generate QR code as PNG buffer with high resolution
    const qrBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 1200, // High resolution for quality
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 30,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const result = Buffer.concat(chunks);
          log.debug('QR code PDF generated:', { size: result.length });
          resolve(result);
        });
        doc.on('error', reject);

        // Calculate maximum QR code size (fill entire page)
        const pageWidth = doc.page.width - 60; // 30px margin on each side
        const pageHeight = doc.page.height - 60;

        // Use the smaller of width or height to keep QR square
        const qrSize = Math.min(pageWidth, pageHeight);

        // Center QR code on page
        const xPosition = (doc.page.width - qrSize) / 2;
        const yPosition = (doc.page.height - qrSize) / 2;

        // Draw QR code image (fills entire page)
        doc.image(qrBuffer, xPosition, yPosition, {
          width: qrSize,
          height: qrSize,
          align: 'center'
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    log.error('Failed to generate QR code PDF:', error);
    throw error;
  }
}
