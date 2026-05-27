"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
const errorHandler_1 = require("../utils/errorHandler");
// Delegate to centralized asyncHandler for consistent behavior
const catchAsync = (fn) => (0, errorHandler_1.asyncHandler)(fn);
exports.catchAsync = catchAsync;
//# sourceMappingURL=catchAsync.js.map