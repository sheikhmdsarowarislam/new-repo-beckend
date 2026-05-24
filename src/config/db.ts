import mongoose from 'mongoose';

declare global {
    // eslint-disable-next-line no-var
    var __mongooseConn: Promise<typeof mongoose> | undefined;
}

const connectWithOptions = async () => {
    const uri = process.env.MONGODB_URL!;
    const isProduction = process.env.NODE_ENV === 'production';
    
    mongoose.set('bufferTimeoutMS', isProduction ? 30000 : 60000);
    
    return mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 60000,
        maxPoolSize: isProduction ? 20 : 10,
        minPoolSize: isProduction ? 5 : 2,
        bufferCommands: false,
        retryWrites: true
    });
};

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error('MONGODB_URL is not set');
        }

        if (!global.__mongooseConn) {
            global.__mongooseConn = connectWithOptions();
        }

        await global.__mongooseConn;
        console.log('✅ MongoDB connected');

        mongoose.connection.on('error', err => {
            console.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.error('⚠️ Mongoose disconnected from database');
        });

    } catch (err: any) {
        console.error('❌ MongoDB connection failed:', err);
        throw err;
    }
};

export default connectDB;