/**
 * PDF Export Service
 * Generates professional PDF reports for medication analysis
 * Works on both mobile (expo-print) and web (jspdf)
 */

import { Platform } from 'react-native';

// Generate HTML template for the report
const generateReportHTML = (data) => {
  const {
    medicationName,
    scanDate,
    naturalAlternatives = [],
    analysis = {},
    userName = 'Naturinex User',
  } = data;

  const formattedDate = new Date(scanDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const alternativesHTML = naturalAlternatives.map((alt, index) => `
    <div style="background-color: #ECFDF5; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 20px; margin-right: 8px;">🌿</span>
        <strong style="color: #065F46; font-size: 16px;">${alt.name || alt}</strong>
      </div>
      ${alt.description ? `<p style="color: #374151; margin: 8px 0;">${alt.description}</p>` : ''}
      ${alt.dosage ? `<p style="color: #6B7280; font-size: 14px; font-style: italic;">Suggested dosage: ${alt.dosage}</p>` : ''}
      ${alt.benefits ? `<p style="color: #059669; font-size: 14px;">Benefits: ${Array.isArray(alt.benefits) ? alt.benefits.join(', ') : alt.benefits}</p>` : ''}
      ${alt.warnings ? `<p style="color: #DC2626; font-size: 14px;">⚠️ ${alt.warnings}</p>` : ''}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Naturinex Wellness Report</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #374151;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #10B981;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #10B981;
          margin-bottom: 8px;
        }
        .tagline {
          color: #6B7280;
          font-size: 14px;
        }
        .report-title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 24px 0 16px 0;
        }
        .medication-name {
          font-size: 28px;
          font-weight: bold;
          color: #10B981;
          margin-bottom: 8px;
        }
        .date {
          color: #6B7280;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E5E7EB;
        }
        .summary {
          background-color: #F9FAFB;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          color: #9CA3AF;
          font-size: 12px;
        }
        .disclaimer {
          background-color: #FEF3C7;
          padding: 16px;
          border-radius: 8px;
          margin-top: 24px;
          font-size: 12px;
          color: #92400E;
        }
        .disclaimer-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🌿 Naturinex</div>
        <div class="tagline">Natural Alternatives for Modern Wellness</div>
      </div>

      <div class="report-title">Wellness Report</div>
      <div class="medication-name">${medicationName || 'Medication Analysis'}</div>
      <div class="date">Generated on ${formattedDate}</div>

      ${analysis.summary ? `
        <div class="section">
          <div class="section-title">Analysis Summary</div>
          <div class="summary">
            <p>${analysis.summary}</p>
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Natural Alternatives (${naturalAlternatives.length})</div>
        ${alternativesHTML || '<p style="color: #9CA3AF;">No alternatives found</p>'}
      </div>

      <div class="disclaimer">
        <div class="disclaimer-title">⚠️ Medical Disclaimer</div>
        <p>This report is for informational purposes only and does not constitute medical advice.
        Always consult with a qualified healthcare provider before making any changes to your
        medication or supplement regimen. Natural alternatives may interact with medications
        and may not be suitable for everyone.</p>
      </div>

      <div class="footer">
        <p>Generated by Naturinex Premium</p>
        <p>Report prepared for: ${userName}</p>
        <p>&copy; ${new Date().getFullYear()} Naturinex. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// Mobile PDF export using expo-print
const exportPdfMobile = async (data) => {
  try {
    const Print = require('expo-print');
    const Sharing = require('expo-sharing');

    const html = generateReportHTML(data);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share your Naturinex report',
        UTI: 'com.adobe.pdf',
      });
      return { success: true, uri };
    } else {
      return { success: true, uri, message: 'PDF saved but sharing not available' };
    }
  } catch (error) {
    console.error('PDF export error (mobile):', error);
    throw new Error('Failed to generate PDF report');
  }
};

// Web PDF export using jspdf
const exportPdfWeb = async (data) => {
  try {
    const { jsPDF } = await import('jspdf');

    const {
      medicationName,
      scanDate,
      naturalAlternatives = [],
      analysis = {},
      userName = 'Naturinex User',
    } = data;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Helper function for text wrapping
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Header
    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129); // Green
    doc.text('Naturinex', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray
    doc.text('Natural Alternatives for Modern Wellness', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Horizontal line
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    // Report title
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39); // Dark
    doc.text('Wellness Report', 20, yPosition);
    yPosition += 12;

    // Medication name
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text(medicationName || 'Medication Analysis', 20, yPosition);
    yPosition += 8;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const formattedDate = new Date(scanDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Generated on ${formattedDate}`, 20, yPosition);
    yPosition += 15;

    // Summary section
    if (analysis.summary) {
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Analysis Summary', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      yPosition = addWrappedText(analysis.summary, 20, yPosition, pageWidth - 40);
      yPosition += 10;
    }

    // Natural Alternatives section
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text(`Natural Alternatives (${naturalAlternatives.length})`, 20, yPosition);
    yPosition += 10;

    naturalAlternatives.forEach((alt, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Alternative name
      doc.setFontSize(12);
      doc.setTextColor(6, 95, 70); // Dark green
      doc.text(`${index + 1}. ${alt.name || alt}`, 25, yPosition);
      yPosition += 7;

      // Description
      if (alt.description) {
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        yPosition = addWrappedText(alt.description, 30, yPosition, pageWidth - 50);
      }

      // Dosage
      if (alt.dosage) {
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Suggested dosage: ${alt.dosage}`, 30, yPosition);
        yPosition += 6;
      }

      yPosition += 8;
    });

    // Disclaimer
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 10;
    doc.setFillColor(254, 243, 199); // Yellow background
    doc.rect(20, yPosition - 5, pageWidth - 40, 35, 'F');

    doc.setFontSize(10);
    doc.setTextColor(146, 64, 14); // Orange text
    doc.text('Medical Disclaimer', 25, yPosition + 3);
    yPosition += 8;

    doc.setFontSize(8);
    const disclaimer = 'This report is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider before making any changes to your medication or supplement regimen.';
    addWrappedText(disclaimer, 25, yPosition, pageWidth - 50, 5);

    // Footer
    yPosition = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Generated by Naturinex Premium', pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Report prepared for: ${userName}`, pageWidth / 2, yPosition + 5, { align: 'center' });

    // Save the PDF
    const filename = `naturinex-report-${Date.now()}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('PDF export error (web):', error);
    throw new Error('Failed to generate PDF report');
  }
};

// Main export function
export const exportToPdf = async (data) => {
  if (Platform.OS === 'web') {
    return exportPdfWeb(data);
  } else {
    return exportPdfMobile(data);
  }
};

// Export HTML template for preview
export const generatePdfPreviewHTML = generateReportHTML;

export default {
  exportToPdf,
  generatePdfPreviewHTML,
};
