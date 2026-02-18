import app from './src/app.js';
import { env } from './src/config/env.js';
import { testConnection } from './src/config/db.js';

async function startServer() {
  try {
    await testConnection();
    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
