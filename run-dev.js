// Simple script to run Electron in dev mode
process.env.DEV_MODE = 'true';
console.log('Starting Focus Pocus in DEV MODE...');
console.log('DEV_MODE environment variable set to:', process.env.DEV_MODE);

require('electron/cli.js');
