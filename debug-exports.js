// Debug script to test PDF and Notion exports
const testCourse = {
  id: 'test-course',
  title: 'Test Course',
  modules: [
    {
      id: 'module-1',
      title: 'Test Module',
      summary: 'This is a test module',
      takeaways: ['Test takeaway 1', 'Test takeaway 2'],
      order: 1
    }
  ],
  metadata: {
    sourceType: 'thread',
    generatedAt: new Date().toISOString(),
    version: 1
  }
};

// Test PDF export
async function testPDFExport() {
  try {
    console.log('Testing PDF export...');
    const response = await fetch('http://localhost:3001/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseData: testCourse }),
    });

    console.log('PDF Response status:', response.status);
    console.log('PDF Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('PDF Error response:', errorText);
    } else {
      console.log('PDF export successful');
    }
  } catch (error) {
    console.error('PDF export error:', error);
  }
}

// Test Marketing PDF export
async function testMarketingPDFExport() {
  try {
    console.log('Testing Marketing PDF export...');
    const marketingAssets = {
      coldDMs: ['Test DM 1', 'Test DM 2'],
      adCopyTemplate: {
        facebook: 'Test Facebook ad',
        twitter: 'Test Twitter ad',
        instagram: 'Test Instagram ad'
      },
      spreadsheetTemplate: {
        description: 'Test spreadsheet',
        headers: ['Header 1', 'Header 2'],
        sampleData: [['Data 1', 'Data 2']]
      },
      bonusResource: {
        title: 'Test Bonus',
        type: 'checklist',
        content: ['Item 1', 'Item 2']
      }
    };

    const response = await fetch('http://localhost:3001/api/export-marketing-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        marketingAssets,
        courseTitle: testCourse.title
      }),
    });

    console.log('Marketing PDF Response status:', response.status);
    console.log('Marketing PDF Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Marketing PDF Error response:', errorText);
    } else {
      console.log('Marketing PDF export successful');
    }
  } catch (error) {
    console.error('Marketing PDF export error:', error);
  }
}

// Test Notion export
async function testNotionExport() {
  try {
    console.log('Testing Notion export...');
    const response = await fetch('http://localhost:3001/api/export-notion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        courseData: testCourse,
        exportType: 'markdown'
      }),
    });

    console.log('Notion Response status:', response.status);
    console.log('Notion Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Notion Error response:', errorText);
    } else {
      console.log('Notion export successful');
    }
  } catch (error) {
    console.error('Notion export error:', error);
  }
}

// Run tests
async function runTests() {
  await testPDFExport();
  console.log('---');
  await testMarketingPDFExport();
  console.log('---');
  await testNotionExport();
}

runTests();