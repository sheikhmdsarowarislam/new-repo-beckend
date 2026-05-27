import mongoose from "mongoose";
/**
 * Executes a function safely within a Mongoose transaction.
 * Automatically commits or aborts transaction and ends session.
 *
 * @param fn - The async function to execute inside the transaction. Receives the session as argument.
 * @returns The result of the function `fn`
 */
export declare const withTransaction: <T>(fn: (session: mongoose.ClientSession) => Promise<T>) => Promise<T>;
//# sourceMappingURL=withTransaction.d.ts.map