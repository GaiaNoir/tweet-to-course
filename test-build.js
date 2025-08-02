const { spawn } = require('child_process');
const path = require('path');

console.log('Starting build test...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Try to run npm run build
const npmProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

npmProcess.on('close', (code) => {
  console.log(`Build process exited with code ${code}`);
});

npmProcess.on('error', (error) => {
  console.error('Error running build:', error);
});
