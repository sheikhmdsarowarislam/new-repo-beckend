"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Executes a function safely within a Mongoose transaction.
 * Automatically commits or aborts transaction and ends session.
 *
 * @param fn - The async function to execute inside the transaction. Receives the session as argument.
 * @returns The result of the function `fn`
 */
const withTransaction = async (fn) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const result = await fn(session);
        await session.commitTransaction();
        return result;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
};
exports.withTransaction = withTransaction;
//# sourceMappingURL=withTransaction.js.map