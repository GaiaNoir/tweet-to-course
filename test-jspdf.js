// Test jsPDF functionality
const jsPDF = require('jspdf');

try {
  console.log('Testing jsPDF...');
  
  // Create a simple PDF
  const pdf = new jsPDF();
  pdf.text('Hello World!', 20, 20);
  
  // Try to generate output
  const output = pdf.output('arraybuffer');
  console.log('jsPDF test successful! Output length:', output.byteLength);
  
} catch (error) {
  console.error('jsPDF test failed:', error);
}