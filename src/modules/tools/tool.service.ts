import cloudinary from "cloudinary";
import Tool from "./tool.model";
import { ServiceResponse } from "../../@types/api";
import EnrollmentModel from "../enrollments/enrollment.model";
import { Types } from "mongoose";

// ── helpers ───────────────────────────────────────────────────────────
async function resolveThumbnail(
  thumbnailInput: any,
  existingPublicId?: string | null
): Promise<{ public_id: string | null; url: string }> {
  if (!thumbnailInput) return { public_id: null, url: "" };

  if (typeof thumbnailInput === "string" && thumbnailInput.startsWith("data:")) {
    if (existingPublicId) await cloudinary.v2.uploader.destroy(existingPublicId);
    const result = await cloudinary.v2.uploader.upload(thumbnailInput, { folder: "tool-thumbnails" });
    return { public_id: result.public_id, url: result.secure_url };
  }

  if (typeof thumbnailInput === "string") {
    return { public_id: null, url: thumbnailInput };
  }

  return { public_id: null, url: "" };
}

// ── CREATE ────────────────────────────────────────────────────────────
export const createTool = async (
  data: any,
  instructorId: string
): Promise<ServiceResponse<any>> => {
  try {
    const thumbnail = await resolveThumbnail(data.thumbnail);

    const toolData: any = {
      ...data,
      instructor: instructorId,
      thumbnail,
    };

    if (data.isPackage) {
      toolData.accessLink = "";
    }

    const tool = await Tool.create(toolData);

    if (data.isPackage) {
      await tool.populate("includedTools", "name thumbnail price status");
    }

    return { success: true, data: tool, message: "Created successfully" };
  } catch (error: any) {
    return { success: false, message: "Creation failed", errors: [error.message] };
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────
export const updateTool = async (
  toolId: string,
  data: any,
  userId: string,
  userRole: string
): Promise<ServiceResponse<any>> => {
  try {
    const tool = await Tool.findById(toolId);
    if (!tool) return { success: false, message: "Not found", errors: [] };

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
    const previousTools: string[] = (tool.includedTools || []).map((t: any) => t.toString());
    const newTools: string[] = (data.includedTools || []).map((t: any) => t.toString());
    const addedTools = newTools.filter(t => !previousTools.includes(t));

    const updated = await Tool.findByIdAndUpdate(toolId, data, { new: true });

    if (updated?.isPackage) {
      await updated.populate("includedTools", "name thumbnail price status");
    }

    // নতুন tools যোগ হলে existing users এ auto add
    if (addedTools.length > 0 && (data.isPackage || tool.isPackage)) {
      const packageEnrollments = await EnrollmentModel.find({
        tool: toolId,
        paymentStatus: { $in: ["paid", "free"] },
      }).lean();

      for (const enrollment of packageEnrollments) {
        for (const newToolId of addedTools) {
          try {
            const alreadyExists = await EnrollmentModel.findOne({
              student: enrollment.student,
              tool: new Types.ObjectId(newToolId),
            });

            if (!alreadyExists) {
              await EnrollmentModel.create({
                student:       enrollment.student,
                tool:          new Types.ObjectId(newToolId),
                itemType:      "tool",
                amountPaid:    0,
                paymentStatus: "paid",
                paymentMethod: "free",
                approvedBy:    enrollment.approvedBy || null,
                approvedAt:    new Date(),
                validUntil:    (enrollment as any).validUntil || null,
                sourcePackage: toolId,
              });
            }
          } catch (err: any) {
            console.error(`Auto-add tool failed ${newToolId}:`, err?.message);
          }
        }
      }
    }

    return { success: true, data: updated, message: "Updated successfully" };
  } catch (error: any) {
    return { success: false, message: "Update failed", errors: [error.message] };
  }
};

// ── DELETE ────────────────────────────────────────────────────────────
export const deleteTool = async (
  toolId: string,
  userId: string,
  userRole: string
): Promise<ServiceResponse<null>> => {
  try {
    const tool = await Tool.findById(toolId);
    if (!tool) return { success: false, message: "Not found", errors: [] };

    if (userRole !== "admin" && tool.instructor.toString() !== userId) {
      return { success: false, message: "Unauthorized", errors: [] };
    }

    if (tool.thumbnail?.public_id) {
      await cloudinary.v2.uploader.destroy(tool.thumbnail.public_id);
    }

    await Tool.findByIdAndDelete(toolId);
    return { success: true, data: null, message: "Deleted successfully" };
  } catch (error: any) {
    return { success: false, message: "Deletion failed", errors: [error.message] };
  }
};

// ── GET ALL (published) ───────────────────────────────────────────────
export const getAllTools = async (): Promise<ServiceResponse<any>> => {
  try {
    const tools = await Tool.find({ status: "published" })
      .populate("instructor", "name avatar")
      .populate("includedTools", "name thumbnail price status")
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, data: tools, message: "Tools retrieved" };
  } catch (error: any) {
    return { success: false, message: "Failed to retrieve tools", errors: [error.message] };
  }
};

// ── GET ALL (admin) ───────────────────────────────────────────────────
export const getAllToolsAdmin = async (): Promise<ServiceResponse<any>> => {
  try {
    const tools = await Tool.find()
      .populate("instructor", "name avatar")
      .populate("includedTools", "name thumbnail price status")
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, data: tools, message: "Tools retrieved" };
  } catch (error: any) {
    return { success: false, message: "Failed to retrieve tools", errors: [error.message] };
  }
};

// ── GET ONE ───────────────────────────────────────────────────────────
export const getToolById = async (toolId: string): Promise<ServiceResponse<any>> => {
  try {
    const tool = await Tool.findById(toolId)
      .populate("instructor", "name avatar")
      .populate("includedTools", "name thumbnail price status accessLink")
      .lean();
    if (!tool) return { success: false, message: "Not found", errors: [] };
    return { success: true, data: tool, message: "Tool retrieved" };
  } catch (error: any) {
    return { success: false, message: "Failed to retrieve tool", errors: [error.message] };
  }
};