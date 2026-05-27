"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToolByIdController = exports.getAllToolsAdminController = exports.getAllToolsController = exports.deleteToolController = exports.updateToolController = exports.createToolController = void 0;
const catchAsync_1 = require("../../middlewares/catchAsync");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
const tool_service_1 = require("./tool.service");
exports.createToolController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await (0, tool_service_1.createTool)(req.body, (0, common_1.getUserId)(req));
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Failed", 400, result.errors);
    return (0, response_1.sendCreated)(res, result.data, result.message);
});
exports.updateToolController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await (0, tool_service_1.updateTool)(req.params.id, req.body, (0, common_1.getUserId)(req), (0, common_1.getUserRole)(req));
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Failed", 400, result.errors);
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
exports.deleteToolController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await (0, tool_service_1.deleteTool)(req.params.id, (0, common_1.getUserId)(req), (0, common_1.getUserRole)(req));
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Failed", 400, result.errors);
    return (0, response_1.sendSuccess)(res, null, result.message);
});
exports.getAllToolsController = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const result = await (0, tool_service_1.getAllTools)();
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Failed", 500, result.errors);
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
exports.getAllToolsAdminController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if ((0, common_1.getUserRole)(req) !== "admin")
        return (0, response_1.sendError)(res, "Unauthorized", 403);
    const result = await (0, tool_service_1.getAllToolsAdmin)();
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Failed", 500, result.errors);
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
exports.getToolByIdController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await (0, tool_service_1.getToolById)(req.params.id);
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Not found", 404, result.errors);
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
//# sourceMappingURL=tool.controller.js.map