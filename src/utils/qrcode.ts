import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { logger } from '../logger';
import { i18n } from '../i18n';

/**
 * Generate QR code as PDF with high-resolution PNG
 * @param data - Data to encode in QR code (deep link URL)
 * @param eventName - Event name (not used in minimalist design)
 * @returns Buffer containing PDF file
 */
export async function generateQRCodePDF(data: string, eventName: string): Promise<Buffer> {
  try {
    logger.debug('Generating QR code PDF:', { data, eventName });

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
          logger.debug('QR code PDF generated:', { size: result.length });
          resolve(result);
        });
        doc.on('error', reject);

        // Calculate maximum QR code size (leave space for text at bottom)
        const pageWidth = doc.page.width - 60; // 30px margin on each side
        const pageHeight = doc.page.height - 60;
        const textHeight = 80; // Space for text at bottom
        const availableHeight = pageHeight - textHeight;

        // Use the smaller of width or available height to keep QR square
        const qrSize = Math.min(pageWidth, availableHeight);

        // Center QR code horizontally and position at top
        const xPosition = (doc.page.width - qrSize) / 2;
        const yPosition = 30;

        // Draw QR code image
        doc.image(qrBuffer, xPosition, yPosition, {
          width: qrSize,
          height: qrSize,
          align: 'center'
        });

        // Add registration text below QR code
        const textY = yPosition + qrSize + 20;
        const registrationText = i18n.t('registration' as any) || 'Registration';

        doc.fontSize(32)
          .font('Helvetica-Bold')
          .fillColor('black')
          .text(registrationText, 30, textY, {
            width: pageWidth,
            align: 'center'
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    logger.error('Failed to generate QR code PDF:', error);
    throw error;
  }
}
