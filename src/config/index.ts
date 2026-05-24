import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database_url: string;
  jwt_access_secret: string;
  jwtRefreshSecret: string;
  cloudinary_cloud_name: string;
  cloudinary_api_key: string;
  cloudinary_api_secret: string;
  redis_url: string;
}

// Environment validation
const requiredEnvVars = [
  'MONGODB_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these variables in your .env file');
  process.exit(1);
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database_url: process.env.MONGODB_URL!,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "your-cloud-name",
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY || "your-api-key",
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || "your-api-secret",
  redis_url: process.env.REDIS_URL || "",
};

export default config;