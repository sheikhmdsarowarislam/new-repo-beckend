import mongoose from 'mongoose';
declare global {
    var __mongooseConn: Promise<typeof mongoose> | undefined;
}
declare const connectDB: () => Promise<void>;
export default connectDB;
//# sourceMappingURL=db.d.ts.map