console.log('=== SERVER.TS STARTING ===');

process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ unhandledRejection (non fatal):', reason?.message ?? reason);
  // On log mais on ne crash pas
});

process.on('uncaughtException', (err) => {
  console.error('💥 uncaughtException (fatal):', err.message);
  process.exit(1);
});

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
    try {
      await redis.ping();
      console.log('✅ Redis connected');
    } catch (redisError) {
      console.warn('⚠️ Redis unavailable — cache disabled, continuing without it');
    }

    console.log('6. Starting cron jobs...');
    try {
      // Import conditionnel pour éviter l'erreur si node-cron n'est pas installé
      const cronModule = await import('@/jobs/cron.jobs');
      if (cronModule.startCronJobs) {
        cronModule.startCronJobs();
        console.log('✅ Cron jobs started');
      } else {
        console.warn('⚠️ Cron jobs module incomplete — continuing without them');
      }
    } catch (cronError) {
      console.warn('⚠️ Cron jobs unavailable — continuing without them');
    }

    console.log('7. Starting server...');
    const server = app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
    });
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }
})();