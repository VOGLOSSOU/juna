// Debug version of the server using ts-node
console.log('🚀 Starting debug server with ts-node...');

const { spawn } = require('child_process');

const tsNode = spawn('npx', ['ts-node', '-r', 'module-alias/register', 'src/server.ts'], {
  stdio: ['inherit', 'inherit', 'inherit'], // Show all output
  cwd: __dirname
});

tsNode.on('close', (code) => {
  console.log(`🔴 Debug server exited with code ${code}`);
  process.exit(code);
});

tsNode.on('error', (error) => {
  console.error('❌ Failed to start debug server:', error);
  process.exit(1);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down debug server...');
  tsNode.kill('SIGINT');
});