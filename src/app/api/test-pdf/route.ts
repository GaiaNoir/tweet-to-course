import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing PDF generation...');
    
    // Create a simple PDF
    const pdf = new jsPDF();
    pdf.text('Hello World!', 20, 20);
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
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

export async function GET() {
  return NextResponse.json({ message: 'Use POST to test PDF generation' });
}