// Simple test to check if basic imports work
console.log('Testing basic imports...');

try {
  require('dotenv').config();
  console.log('✅ dotenv loaded');

  const env = require('./src/config/env.ts');
  console.log('✅ env config loaded');

  const database = require('./src/config/database.ts');
  console.log('✅ database config loaded');

  console.log('✅ All basic imports successful');
} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error(error.stack);
}