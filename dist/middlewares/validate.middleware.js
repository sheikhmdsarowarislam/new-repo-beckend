"use strict";
// src/middlewares/validate.middleware.ts (FINAL, CORRECTED VERSION)
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const catchAsync_1 = require("./catchAsync");
const errorHandler_1 = require("../utils/errorHandler");
// The schema type now uses the correct ZodObject interface
const validate = (schema) => 
// We use catchAsync to handle the promise rejection from parseAsync
(0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // 1. Build the data object by only including parts defined in the schema's shape.
    const dataToValidate = {};
    // Check if the property is part of the schema definition before accessing req.property
    if (schema.shape.body)
        dataToValidate.body = req.body;
    if (schema.shape.params)
        dataToValidate.params = req.params;
    if (schema.shape.query) {
        // Only include query in validation if it exists, to properly handle .optional() schemas
        if (req.query && Object.keys(req.query).length > 0) {
            dataToValidate.query = req.query;
        }
        // If query is empty/undefined and the schema allows optional, Zod will handle it properly
    }
    if (schema.shape.cookies)
        dataToValidate.cookies = req.cookies;
    try {
        // 2. Perform validation and sanitize the data.
        const validatedData = await schema.parseAsync(dataToValidate);
        // 3. Overwrite the request object with the sanitized and validated data (Best Practice)
        if (validatedData.body)
            req.body = validatedData.body;
        if (validatedData.params)
            req.params = validatedData.params;
        if (validatedData.query)
            req.query = validatedData.query;
        next();
    }
    catch (error) {
        // This is the clean Zod error handler called by catchAsync
        if (error instanceof zod_1.ZodError) {
            const errorMessages = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
            console.error("Validation Error (Zod):", errorMessages);
            // Throw 400 Bad Request
            throw (0, errorHandler_1.createError)(`Validation Failed: ${errorMessages.join(", ")}`, 400);
        }
        // Log the actual error for debugging
        console.error("Validation Error (Non-Zod):", error);
        console.error("Error details:", error.message, error.stack);
        // Throw a 500 for any non-Zod error
        throw (0, errorHandler_1.createError)(`Validation failed due to an unexpected server error: ${error.message}`, 500);
    }
});
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map