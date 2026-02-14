import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { logger } from '../logger';

/**
 * Generate QR code as vector PDF
 * @param data - Data to encode in QR code (deep link URL)
 * @param eventName - Event name for PDF title
 * @returns Buffer containing PDF file
 */
export async function generateQRCodePDF(data: string, eventName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      logger.debug('Generating QR code PDF:', { data, eventName });

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        logger.debug('QR code PDF generated:', { size: result.length });
        resolve(result);
      });
      doc.on('error', reject);

      // Add title
      doc.fontSize(24).text(eventName, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text('Event Registration QR Code', { align: 'center' });
      doc.moveDown(2);

      // Generate QR code as SVG path
      QRCode.toString(data, { type: 'svg', margin: 0 }, (err, svg) => {
        if (err) {
          reject(err);
          return;
        }

        // Parse SVG and extract path data
        const pathMatch = svg.match(/<path[^>]*d="([^"]+)"/);
        if (!pathMatch) {
          reject(new Error('Failed to parse QR code SVG'));
          return;
        }

        const pathData = pathMatch[1];

        // Calculate QR code size and position (centered)
        const qrSize = 300;
        const pageWidth = doc.page.width;
        const xPosition = (pageWidth - qrSize) / 2;
        const yPosition = doc.y;

        // Draw QR code using SVG path (vector graphics)
        doc.save();
        doc.translate(xPosition, yPosition);
        doc.scale(qrSize / 100); // Scale QR code to desired size
        doc.path(pathData).fill('black');
        doc.restore();

        // Add deep link text below QR code
        doc.y = yPosition + qrSize + 30;
        doc.fontSize(10).fillColor('gray').text(data, { align: 'center' });

        // Add instructions
        doc.moveDown(2);
        doc.fontSize(11).fillColor('black').text(
          'Scan this QR code with your phone camera or Telegram app to register for the event.',
          { align: 'center', width: 400 }
        );

        doc.end();
      });
    } catch (error) {
      logger.error('Failed to generate QR code PDF:', error);
      reject(error);
    }
  });
}
