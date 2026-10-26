// Haven API Server Bootstrap
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function bootstrap() {
  await connectDB();

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Haven server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`📡 Health check available at http://localhost:${env.PORT}/api/health`);
  });

  const handleShutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
