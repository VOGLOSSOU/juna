console.log('=== SERVER.TS STARTING ===');

(async () => {
  try {
    console.log('1. Importing app...');
    const app = (await import('./app')).default;
    
    console.log('2. Importing config...');
    const { env, validateEnv } = await import('@/config/env');
    const { connectDatabase, disconnectDatabase } = await import('@/config/database');
    const redis = (await import('@/config/redis')).default;
    
    console.log('3. Validating env...');
    validateEnv();
    
    console.log('4. Connecting to database...');
    await connectDatabase();
    
    console.log('5. Checking Redis...');
    await redis.ping();
    console.log('✅ Redis connected');
    
    console.log('6. Starting server...');
    const server = app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
    });
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }
})();