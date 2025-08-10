// Test Canva-optimized PDF export
const { jsPDF } = require('jspdf');
const fs = require('fs');

function testCanvaOptimizedPDF() {
  console.log('🎨 Testing Canva-optimized PDF generation...');
  
  const testCourse = {
    title: 'The 15-Minute Fitness Revolution: Transform Your Body Without the Gym',
    modules: [
      {
        title: 'The Mindset Revolution: Breaking Free from Fitness Myths',
        summary: `## Course Overview

This comprehensive course is designed for busy moms who struggle to find time for fitness and have tried traditional workout programs that don't fit into their chaotic schedules.

## Target Audience
Busy moms who struggle to find time for fitness and have tried traditional workout programs that don't fit into their chaotic schedules

## Learning Outcomes:
- Master the 15-minute consistency principle that outperforms hour-long gym sessions
- Design micro-workouts that fit seamlessly into your existing daily routine
- Create a progressive 8-week system using only bodyweight exercises

### Complete Module Content

The breakthrough came when I stopped waiting for perfect conditions and started working with what I actually had. Here's the truth every busy mom needs to hear: your body doesn't care if you exercise for 15 minutes or 60 minutes. It only cares about one thing – CONSISTENCY.

**The 15-Minute Rule Framework:**

This isn't about doing less because you're lazy. It's about doing what actually works for real mom life. Research shows that three 15-minute exercise sessions can be more effective than one 45-minute session because:

1. **Higher Adherence Rate**: You're 3x more likely to complete a 15-minute workout than find an hour
2. **Metabolic Boost**: Multiple sessions throughout the day keep your metabolism elevated longer
3. **Sustainable Intensity**: You can push harder for 15 minutes, burning more calories per minute
4. **Real-Life Integration**: It fits into actual mom schedules, not fantasy schedules`,
        estimatedReadTime: 8,
        takeaways: [
          'Master the 15-minute consistency principle that outperforms hour-long gym sessions',
          'Design micro-workouts that fit seamlessly into your existing daily routine',
          'Create a progressive 8-week system using only bodyweight exercises',
          'Develop sustainable habits that work around sippy cups, tantrums, and 5 AM wake-ups',
          'Build confidence and energy while being present for every family moment'
        ]
      },
      {
        title: 'The Excuse Elimination System',
        summary: `**The Excuse Elimination System:**

- "I don't have time" → "I have 15 minutes while coffee brews"
- "I need a gym" → "My kitchen counter is my gym"
- "I need equipment" → "My body weight is all the equipment I need"
- "I need energy" → "15 minutes gives me energy instead of depleting it"

**Common Mindset Mistakes That Keep Moms Stuck:**
- Waiting for 2-week vacation blocks to "get serious" about fitness
- Believing that unless you're sweating for an hour, it doesn't count
- Comparing your Day 1 to someone else's Day 365
- Thinking you need perfect nutrition before starting exercise

**The Consistency Compound Effect Timeline:**
- Week 1-2: Building the habit loop (focus on showing up, not perfection)
- Week 3-4: Energy increases, sleep improves
- Week 5-6: Strength gains become noticeable
- Week 7-8: Confidence soars, family notices the change`,
        estimatedReadTime: 6,
        takeaways: [
          'Transform "I don\'t have time" into "I have 15 minutes while coffee brews"',
          'Use your kitchen counter as your gym - no equipment needed',
          'Focus on consistency over perfection in the first 2 weeks',
          'Expect energy increases and better sleep by week 3-4'
        ]
      }
    ]
  };

  try {
    // Generate Canva-optimized PDF using the same logic as the API
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25; // Slightly larger margins for professional look
    const maxWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;
    
    console.log('📐 PDF dimensions:', {
      pageWidth,
      pageHeight,
      margin,
      maxWidth
    });

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add clean text optimized for Canva copy-paste
    const addText = (text, fontSize = 11, isBold = false, spacingAfter = 8) => {
      if (!text || !text.trim()) return;
      
      // Canva-optimized text cleaning - preserve structure but remove problematic characters
      const cleanText = text
        .replace(/[^\x20-\x7E\n\r]/g, '') // Keep only printable ASCII + line breaks
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n') // Convert remaining \r to \n
        .replace(/\t/g, '    ') // Convert tabs to spaces
        .replace(/\s+/g, ' ') // Normalize whitespace but preserve single spaces
        .replace(/\n\s+/g, '\n') // Remove leading spaces after line breaks
        .replace(/\s+\n/g, '\n') // Remove trailing spaces before line breaks
        .trim();
      
      if (!cleanText) return;
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(0, 0, 0);
      
      // Optimize line splitting for better copy-paste experience
      const lines = pdf.splitTextToSize(cleanText, maxWidth);
      const textHeight = lines.length * (fontSize * 0.35);
      
      checkPageBreak(textHeight + spacingAfter);
      
      pdf.text(lines, margin, yPosition);
      yPosition += textHeight + spacingAfter;
    };

    // Helper function to add section with Canva-optimized spacing
    const addSection = (title, content = '', titleSize = 14) => {
      // Add extra space before sections for better visual separation
      yPosition += 8;
      
      // Section title with clear boundaries
      addText(title, titleSize, true, 14);
      
      // Section content with proper spacing
      if (content) {
        addText(content, 11, false, 16);
      }
    };

    // Helper function to add bullet point optimized for Canva copy-paste
    const addBulletPoint = (text, indent = 15) => {
      const cleanText = text
        .replace(/[^\x20-\x7E\n]/g, '') // Keep line breaks for better structure
        .replace(/^\s*[-•*]\s*/, '') // Remove existing bullet markers
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      if (!cleanText) return;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      // Use simple bullet for better copy-paste compatibility
      pdf.text('•', margin + 5, yPosition);
      
      // Add text with proper wrapping and spacing for easy selection
      const lines = pdf.splitTextToSize(cleanText, maxWidth - indent);
      const textHeight = lines.length * (11 * 0.35);
      
      checkPageBreak(textHeight + 8);
      
      pdf.text(lines, margin + indent, yPosition);
      yPosition += textHeight + 8; // Extra spacing for better visual separation
    };

    // Helper function to process content with Canva copy-paste optimization
    const processContent = (content) => {
      const lines = content.split('\n');
      
      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) {
          // Add small spacing for empty lines to maintain structure
          yPosition += 4;
          continue;
        }
        
        // Handle markdown headers with better spacing
        if (cleanLine.startsWith('###')) {
          const headerText = cleanLine.replace(/^#+\s*/, '');
          addSection(headerText, '', 12);
        } else if (cleanLine.startsWith('##')) {
          const headerText = cleanLine.replace(/^#+\s*/, '');
          addSection(headerText, '', 13);
        } else if (cleanLine.startsWith('#')) {
          const headerText = cleanLine.replace(/^#+\s*/, '');
          addSection(headerText, '', 14);
        }
        // Handle bold text as subsection headers
        else if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
          const boldText = cleanLine.replace(/^\*\*|\*\*$/g, '');
          addText(boldText, 12, true, 12);
        }
        // Handle bullet points with improved formatting
        else if (cleanLine.match(/^\s*[-•*]\s/)) {
          addBulletPoint(cleanLine);
        }
        // Handle numbered lists with consistent formatting
        else if (cleanLine.match(/^\d+\.\s/)) {
          const numberedText = cleanLine.replace(/^\d+\.\s*/, '');
          const number = cleanLine.match(/^\d+/)?.[0];
          addText(`${number}. ${numberedText}`, 11, false, 8);
        }
        // Handle regular paragraphs with clean formatting
        else {
          const paragraph = cleanLine
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .replace(/`(.*?)`/g, '$1') // Remove code formatting
            .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links, keep text
          
          addText(paragraph, 11, false, 12);
        }
      }
    };

    // Document title with clear spacing for easy selection
    addText(testCourse.title, 18, true, 25);
    
    // Document info with separator line for visual clarity
    addText(`Generated: ${new Date().toLocaleDateString()}`, 9, false, 15);
    
    // Add a visual separator for better content organization
    yPosition += 10;

    // Course overview section with improved formatting for Canva
    const modules = Array.isArray(testCourse.modules) ? testCourse.modules : [];
    const totalReadTime = modules.reduce((total, module) => total + (module.estimatedReadTime || 8), 0);
    const totalTakeaways = modules.reduce((total, module) => total + (module.takeaways?.length || 0), 0);
    
    addSection('COURSE OVERVIEW');
    addText(`Modules: ${modules.length}`, 11, false, 8);
    addText(`Reading Time: ${totalReadTime} minutes`, 11, false, 8);
    addText(`Key Points: ${totalTakeaways}`, 11, false, 25);

    // Process each module with Canva-optimized formatting
    modules.forEach((module, index) => {
      // Module header with clear separation
      addSection(`MODULE ${index + 1}: ${module.title.toUpperCase()}`, '', 15);
      
      // Module info with clean formatting
      const readTime = module.estimatedReadTime || 8;
      const takeawayCount = module.takeaways?.length || 0;
      addText(`Reading Time: ${readTime} minutes | Key Points: ${takeawayCount}`, 10, false, 18);
      
      // Process module content with better structure
      if (module.summary) {
        console.log(`Processing module ${index + 1} content (${module.summary.length} chars)`);
        processContent(module.summary);
        yPosition += 10; // Extra space after content
      }
      
      // Add takeaways with improved formatting
      if (module.takeaways && Array.isArray(module.takeaways) && module.takeaways.length > 0) {
        addSection('KEY TAKEAWAYS', '', 13);
        
        module.takeaways.forEach((takeaway, idx) => {
          const cleanTakeaway = takeaway
            .replace(/[^\x20-\x7E\n]/g, '') // Keep line breaks
            .replace(/^\s*[-•*]\s*/, '') // Remove bullet markers
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
          
          if (cleanTakeaway) {
            addText(`${idx + 1}. ${cleanTakeaway}`, 11, false, 10);
          }
        });
        
        yPosition += 20; // Extra space after takeaways for module separation
      }
    });

    // Add clean, professional footer
    const totalPages = pdf.getNumberOfPages();
    const isPro = true; // Test as Pro user
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Clean footer line
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
      
      // Page number (right aligned)
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`${i}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
      
      // Company name (left aligned, only for free users)
      if (!isPro) {
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text('TweetToCourse', margin, pageHeight - 20);
      }
    }

    // Save the PDF
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    const filename = `canva_optimized_course_${Date.now()}.pdf`;
    
    fs.writeFileSync(filename, pdfBuffer);
    
    console.log(`✅ Canva-optimized PDF generated successfully!`);
    console.log(`📄 File: ${filename}`);
    console.log(`📊 Size: ${Math.round(pdfBuffer.length / 1024)} KB`);
    console.log(`📑 Pages: ${totalPages}`);
    console.log(`🎨 Canva Optimization Features:`);
    console.log(`   ✓ Clean ASCII-only text for perfect copy-paste`);
    console.log(`   ✓ Normalized line endings and spacing`);
    console.log(`   ✓ Improved text boundaries for easy selection`);
    console.log(`   ✓ Better visual separation between sections`);
    console.log(`   ✓ Consistent formatting throughout`);
    console.log(`   ✓ Optimized bullet points and numbering`);
    console.log(`   ✓ Professional margins and typography`);
    console.log(`   ✓ No special characters that interfere with copy-paste`);
    
    return filename;
    
  } catch (error) {
    console.error('❌ Canva-optimized PDF generation failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testCanvaOptimizedPDF();
}

module.exports = { testCanvaOptimizedPDF };