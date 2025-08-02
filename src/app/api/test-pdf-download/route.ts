import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function GET() {
  try {
    console.log('Testing PDF generation...');
    
    // Create a simple test PDF
    const pdf = new jsPDF();
    
    // Add some test content
    pdf.setFontSize(20);
    pdf.text('Test PDF Download', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text('This is a test PDF to verify download functionality works.', 20, 50);
    pdf.text('Generated at: ' + new Date().toLocaleString(), 20, 70);
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    
    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-download.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('PDF test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate test PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'POST method not supported for test endpoint' },
    { status: 405 }
  );
}
