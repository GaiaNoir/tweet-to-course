import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canPerformAction, incrementUsage } from '@/lib/auth';
import { exportSystem, ExportOptions } from '@/lib/export-system';

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, exportOptions } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get the course from database
    const course = await database.getCourse(courseId, userId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found or access denied' },
        { status: 404 }
      );
    }

    // User is already validated above

    // Free users get basic exports with watermarks
    const options: ExportOptions = {
      includeSlides: true,
      includeCoverArt: user.subscriptionTier !== 'free', // Cover art for paid users only
      includeSalesPage: user.subscriptionTier !== 'free', // Sales page for paid users only
      includeMarketing: user.subscriptionTier !== 'free', // Marketing for paid users only
      slideTheme: exportOptions?.slideTheme || 'professional',
      coverArtStyles: exportOptions?.coverArtStyles || ['professional', 'creative', 'minimal'],
      format: 'zip',
      ...exportOptions
    };

    // Generate the complete package
    const exportPackage = await exportSystem.generateCompletePackage(course, options);
    
    // Create ZIP archive
    const zipBuffer = await exportSystem.createZipArchive(exportPackage);
    
    // Log the export activity
    await database.incrementUsageCount(userId, 'export_package');

    // Generate filename
    const courseName = course.title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 30);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${courseName}-complete-package-${timestamp}.zip`;

    // Return the ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export package error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate export package' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get the course from database
    const course = await database.getCourse(courseId, userId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found or access denied' },
        { status: 404 }
      );
    }

    // User is already validated above

    // Return available export options based on subscription
    const availableOptions = {
      slides: true,
      coverArt: user.subscriptionTier !== 'free',
      salesPage: user.subscriptionTier !== 'free',
      marketing: user.subscriptionTier !== 'free',
      themes: Object.keys(exportSystem.getDefaultExportOptions()),
      subscriptionTier: user.subscriptionTier,
      upgradeRequired: user.subscriptionTier === 'free'
    };

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        moduleCount: course.modules.length
      },
      availableOptions
    });

  } catch (error) {
    console.error('Export options error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get export options' 
      },
      { status: 500 }
    );
  }
}