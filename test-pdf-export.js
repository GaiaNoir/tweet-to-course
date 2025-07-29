// Test PDF export with sample course data
const testCourse = {
  title: "Test Course",
  modules: [
    {
      title: "Module 1: Introduction",
      summary: "This is a test module summary",
      takeaways: [
        "Learn the basics",
        "Understand key concepts",
        "Apply knowledge"
      ]
    },
    {
      title: "Module 2: Advanced Topics",
      summary: "Advanced concepts and techniques",
      takeaways: [
        "Master advanced skills",
        "Implement best practices"
      ]
    }
  ]
};

async function testPDFExport() {
  try {
    console.log('Testing PDF export...');
    
    const response = await fetch('http://localhost:3000/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseData: testCourse
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const blob = await response.blob();
      console.log('PDF size:', blob.size, 'bytes');
      console.log('✅ PDF export successful!');
    } else {
      const errorText = await response.text();
      console.log('❌ PDF export failed:', errorText);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testPDFExport();