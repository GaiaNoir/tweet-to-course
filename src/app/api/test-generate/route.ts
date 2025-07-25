import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        // Simple mock response
        const mockCourse = {
            id: 'test-course-' + Date.now(),
            title: 'Test Course from: ' + content.substring(0, 50) + '...',
            modules: [
                {
                    id: 'module-1',
                    title: 'Module 1: Introduction',
                    summary: 'This is a test module generated from your content.',
                    takeaways: [
                        'Understanding the basics',
                        'Key concepts explained',
                        'Practical applications'
                    ],
                    order: 1,
                    estimatedReadTime: 5
                }
            ],
            metadata: {
                sourceType: 'text' as const,
                sourceContent: content,
                generatedAt: new Date().toISOString(),
                version: 1
            }
        };

        return NextResponse.json({
            success: true,
            course: mockCourse
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}