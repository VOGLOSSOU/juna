// Test if @/ imports work
try {
  require('module-alias/register');
  console.log('✅ module-alias registered');

  const env = require('@/config/env');
  console.log('✅ @/config/env imported successfully');

  const database = require('@/config/database');
  console.log('✅ @/config/database imported successfully');

  console.log('✅ All @/ imports working');
} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('Stack:', error.stack);
}