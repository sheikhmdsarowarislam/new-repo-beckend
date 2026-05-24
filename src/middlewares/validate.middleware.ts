// src/middlewares/validate.middleware.ts (FINAL, CORRECTED VERSION)

import { Request, Response, NextFunction } from "express";
import {  ZodError, ZodObject } from "zod";
import { catchAsync } from "./catchAsync";

import { createError } from "../utils/errorHandler";

// The schema type now uses the correct ZodObject interface
export const validate = (schema: ZodObject<any, any>) =>
  // We use catchAsync to handle the promise rejection from parseAsync
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1. Build the data object by only including parts defined in the schema's shape.
    const dataToValidate: { [key: string]: any } = {};

    // Check if the property is part of the schema definition before accessing req.property
    if (schema.shape.body) dataToValidate.body = req.body;
    if (schema.shape.params) dataToValidate.params = req.params;
    if (schema.shape.query) {
      // Only include query in validation if it exists, to properly handle .optional() schemas
      if (req.query && Object.keys(req.query).length > 0) {
        dataToValidate.query = req.query;
      }
      // If query is empty/undefined and the schema allows optional, Zod will handle it properly
    }
    if (schema.shape.cookies) dataToValidate.cookies = req.cookies;

    try {
      // 2. Perform validation and sanitize the data.
      const validatedData = await schema.parseAsync(dataToValidate);

      // 3. Overwrite the request object with the sanitized and validated data (Best Practice)
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.params) req.params = validatedData.params as any;
      if (validatedData.query) req.query = validatedData.query as any;

      next();
    } catch (error: any) {
      // This is the clean Zod error handler called by catchAsync
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        console.error("Validation Error (Zod):", errorMessages);
        // Throw 400 Bad Request
        throw createError(
          `Validation Failed: ${errorMessages.join(", ")}`,
          400
        );
      }

      // Log the actual error for debugging
      console.error("Validation Error (Non-Zod):", error);
      console.error("Error details:", error.message, error.stack);
      
      // Throw a 500 for any non-Zod error
      throw createError(
        `Validation failed due to an unexpected server error: ${error.message}`,
        500
      );
    }
  });