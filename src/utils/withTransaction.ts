
import mongoose from "mongoose";

/**
 * Executes a function safely within a Mongoose transaction.
 * Automatically commits or aborts transaction and ends session.
 *
 * @param fn - The async function to execute inside the transaction. Receives the session as argument.
 * @returns The result of the function `fn`
 */
export const withTransaction = async <T>(
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};