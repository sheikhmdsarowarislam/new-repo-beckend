"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToolById = exports.getAllToolsAdmin = exports.getAllTools = exports.deleteTool = exports.updateTool = exports.createTool = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const tool_model_1 = __importDefault(require("./tool.model"));
const enrollment_model_1 = __importDefault(require("../enrollments/enrollment.model"));
const mongoose_1 = require("mongoose");
// ── helpers ───────────────────────────────────────────────────────────
async function resolveThumbnail(thumbnailInput, existingPublicId) {
    if (!thumbnailInput)
        return { public_id: null, url: "" };
    if (typeof thumbnailInput === "string" && thumbnailInput.startsWith("data:")) {
        if (existingPublicId)
            await cloudinary_1.default.v2.uploader.destroy(existingPublicId);
        const result = await cloudinary_1.default.v2.uploader.upload(thumbnailInput, { folder: "tool-thumbnails" });
        return { public_id: result.public_id, url: result.secure_url };
    }
    if (typeof thumbnailInput === "string") {
        return { public_id: null, url: thumbnailInput };
    }
    return { public_id: null, url: "" };
}
// ── CREATE ────────────────────────────────────────────────────────────
const createTool = async (data, instructorId) => {
    try {
        const thumbnail = await resolveThumbnail(data.thumbnail);
        const toolData = {
            ...data,
            instructor: instructorId,
            thumbnail,
        };
        if (data.isPackage) {
            toolData.accessLink = "";
        }
        const tool = await tool_model_1.default.create(toolData);
        if (data.isPackage) {
            await tool.populate("includedTools", "name thumbnail price status");
        }
        return { success: true, data: tool, message: "Created successfully" };
    }
    catch (error) {
        return { success: false, message: "Creation failed", errors: [error.message] };
    }
};
exports.createTool = createTool;
// ── UPDATE ────────────────────────────────────────────────────────────
const updateTool = async (toolId, data, userId, userRole) => {
    try {
        const tool = await tool_model_1.default.findById(toolId);
        if (!tool)
            return { success: false, message: "Not found", errors: [] };
        if (userRole !== "admin" && tool.instructor.toString() !== userId) {
            return { success: false, message: "Unauthorized", errors: [] };
        }
        if (data.thumbnail !== undefined) {
            data.thumbnail = await resolveThumbnail(data.thumbnail, tool.thumbnail?.public_id);
        }
        if (data.isPackage || tool.isPackage) {
            data.accessLink = "";
        }
        // নতুন tools যোগ হয়েছে কিনা check
        const previousTools = (tool.includedTools || []).map((t) => t.toString());
        const newTools = (data.includedTools || []).map((t) => t.toString());
        const addedTools = newTools.filter(t => !previousTools.includes(t));
        const updated = await tool_model_1.default.findByIdAndUpdate(toolId, data, { new: true });
        if (updated?.isPackage) {
            await updated.populate("includedTools", "name thumbnail price status");
        }
        // নতুন tools যোগ হলে existing users এ auto add
        if (addedTools.length > 0 && (data.isPackage || tool.isPackage)) {
            const packageEnrollments = await enrollment_model_1.default.find({
                tool: toolId,
                paymentStatus: { $in: ["paid", "free"] },
            }).lean();
            for (const enrollment of packageEnrollments) {
                for (const newToolId of addedTools) {
                    try {
                        const alreadyExists = await enrollment_model_1.default.findOne({
                            student: enrollment.student,
                            tool: new mongoose_1.Types.ObjectId(newToolId),
                        });
                        if (!alreadyExists) {
                            await enrollment_model_1.default.create({
                                student: enrollment.student,
                                tool: new mongoose_1.Types.ObjectId(newToolId),
                                itemType: "tool",
                                amountPaid: 0,
                                paymentStatus: "paid",
                                paymentMethod: "free",
                                approvedBy: enrollment.approvedBy || null,
                                approvedAt: new Date(),
                                validUntil: enrollment.validUntil || null,
                                sourcePackage: toolId,
                            });
                        }
                    }
                    catch (err) {
                        console.error(`Auto-add tool failed ${newToolId}:`, err?.message);
                    }
                }
            }
        }
        return { success: true, data: updated, message: "Updated successfully" };
    }
    catch (error) {
        return { success: false, message: "Update failed", errors: [error.message] };
    }
};
exports.updateTool = updateTool;
// ── DELETE ────────────────────────────────────────────────────────────
const deleteTool = async (toolId, userId, userRole) => {
    try {
        const tool = await tool_model_1.default.findById(toolId);
        if (!tool)
            return { success: false, message: "Not found", errors: [] };
        if (userRole !== "admin" && tool.instructor.toString() !== userId) {
            return { success: false, message: "Unauthorized", errors: [] };
        }
        if (tool.thumbnail?.public_id) {
            await cloudinary_1.default.v2.uploader.destroy(tool.thumbnail.public_id);
        }
        await tool_model_1.default.findByIdAndDelete(toolId);
        return { success: true, data: null, message: "Deleted successfully" };
    }
    catch (error) {
        return { success: false, message: "Deletion failed", errors: [error.message] };
    }
};
exports.deleteTool = deleteTool;
// ── GET ALL (published) ───────────────────────────────────────────────
const getAllTools = async () => {
    try {
        const tools = await tool_model_1.default.find({ status: "published" })
            .populate("instructor", "name avatar")
            .populate("includedTools", "name thumbnail price status")
            .sort({ createdAt: -1 })
            .lean();
        return { success: true, data: tools, message: "Tools retrieved" };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve tools", errors: [error.message] };
    }
};
exports.getAllTools = getAllTools;
// ── GET ALL (admin) ───────────────────────────────────────────────────
const getAllToolsAdmin = async () => {
    try {
        const tools = await tool_model_1.default.find()
            .populate("instructor", "name avatar")
            .populate("includedTools", "name thumbnail price status")
            .sort({ createdAt: -1 })
            .lean();
        return { success: true, data: tools, message: "Tools retrieved" };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve tools", errors: [error.message] };
    }
};
exports.getAllToolsAdmin = getAllToolsAdmin;
// ── GET ONE ───────────────────────────────────────────────────────────
const getToolById = async (toolId) => {
    try {
        const tool = await tool_model_1.default.findById(toolId)
            .populate("instructor", "name avatar")
            .populate("includedTools", "name thumbnail price status accessLink")
            .lean();
        if (!tool)
            return { success: false, message: "Not found", errors: [] };
        return { success: true, data: tool, message: "Tool retrieved" };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve tool", errors: [error.message] };
    }
};
exports.getToolById = getToolById;
//# sourceMappingURL=tool.service.js.map