import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canPerformAction, incrementUsage } from '@/lib/auth';
import jsPDF from 'jspdf';
import { MarketingAssets } from '@/lib/marketing-assets-generator';

interface ExportMarketingPDFRequest {
  marketingAssets: MarketingAssets;
  courseTitle: string;
  includeWatermark?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // For debugging - log the auth status
    console.log('Marketing PDF Export - Auth status:', { userId });
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: ExportMarketingPDFRequest = await request.json();
    const { marketingAssets, courseTitle } = body;

    if (!marketingAssets || !courseTitle) {
      return NextResponse.json(
        { success: false, error: 'Marketing assets and course title are required' },
        { status: 400 }
      );
    }

    // Get user data and check permissions
    const dbUser = await UserService.getUserByAuthId(userId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user can export PDF
    if (!canPerformAction(dbUser.subscription_tier, dbUser.usage_count, 'export_pdf')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PDF export not available for your subscription tier',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      
      // Check if we need a new page
      if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.5 + 5;
    };

    const addSection = (title: string) => {
      yPosition += 10;
      addText(title, 16, true);
      yPosition += 5;
    };

    // Add title
    addText(`${courseTitle} - Marketing Assets`, 20, true);
    yPosition += 10;

    // Add generation date
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
    yPosition += 15;

    // Cold DMs Section
    addSection('🔥 Cold DMs & Outreach Messages');
    marketingAssets.coldDMs.forEach((dm, index) => {
      addText(`Message ${index + 1}:`, 12, true);
      addText(dm, 11);
      yPosition += 10;
    });

    // Ad Copy Templates Section
    addSection('📱 Ad Copy Templates');
    
    addText('Facebook/Meta Ads:', 12, true);
    addText(marketingAssets.adCopyTemplate.facebook, 11);
    yPosition += 10;
    
    addText('Twitter/X Promoted Posts:', 12, true);
    addText(marketingAssets.adCopyTemplate.twitter, 11);
    yPosition += 10;
    
    addText('Instagram Ads:', 12, true);
    addText(marketingAssets.adCopyTemplate.instagram, 11);
    yPosition += 15;

    // Spreadsheet Template Section
    addSection('📊 Marketing Tracking Spreadsheet');
    addText(marketingAssets.spreadsheetTemplate.description, 11);
    yPosition += 10;
    
    addText('Headers:', 12, true);
    addText(marketingAssets.spreadsheetTemplate.headers.join(' | '), 10);
    yPosition += 10;
    
    addText('Sample Data:', 12, true);
    marketingAssets.spreadsheetTemplate.sampleData.forEach((row, index) => {
      addText(`Row ${index + 1}: ${row.join(' | ')}`, 9);
    });
    yPosition += 15;

    // Bonus Resource Section
    addSection(`🎯 Bonus Resource: ${marketingAssets.bonusResource.title}`);
    addText(`Type: ${marketingAssets.bonusResource.type.charAt(0).toUpperCase() + marketingAssets.bonusResource.type.slice(1)}`, 11);
    yPosition += 5;
    
    marketingAssets.bonusResource.content.forEach((item, index) => {
      addText(`${index + 1}. ${item}`, 11);
    });

    // Add watermark for free users
    const shouldAddWatermark = !canPerformAction(user.subscription_tier, user.usage_count, 'remove_watermark');
    
    if (shouldAddWatermark) {
      // Add watermark to each page
      const totalPages = pdf.getNumberOfPages();
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Generated by AI Course Alchemist - Upgrade to remove watermark', 
          pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    }

    // Log the export action
    await UsageService.logAction({
      user_id: dbUser.id,
      action: 'export_marketing_pdf',
      metadata: {
        course_title: courseTitle,
        has_watermark: shouldAddWatermark,
        asset_types: ['coldDMs', 'adCopy', 'spreadsheet', 'bonusResource'],
      },
    });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF as download
    const filename = `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_marketing_assets.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Marketing PDF export error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export marketing assets as PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'GET method not supported' },
    { status: 405 }
  );
}