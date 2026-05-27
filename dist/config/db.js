"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectWithOptions = async () => {
    const uri = process.env.MONGODB_URL;
    const isProduction = process.env.NODE_ENV === 'production';
    mongoose_1.default.set('bufferTimeoutMS', isProduction ? 30000 : 60000);
    return mongoose_1.default.connect(uri, {
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
        mongoose_1.default.connection.on('error', err => {
            console.error('❌ Mongoose connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.error('⚠️ Mongoose disconnected from database');
        });
    }
    catch (err) {
        console.error('❌ MongoDB connection failed:', err);
        throw err;
    }
};
exports.default = connectDB;
//# sourceMappingURL=db.js.map