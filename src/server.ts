import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/db';
import config from './config';
import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
    cloud_name: config.cloudinary_cloud_name,
    api_key: config.cloudinary_api_key,
    api_secret: config.cloudinary_api_secret,
})

const PORT = config.port || 8000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();