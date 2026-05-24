import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import { AuthRequest } from "../../middlewares/auth";
import { getUserId, getUserRole } from "../../utils/common";
import { sendSuccess, sendError, sendCreated } from "../../utils/response";
import { createTool, updateTool, deleteTool, getAllTools, getAllToolsAdmin, getToolById } from "./tool.service";

export const createToolController = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await createTool(req.body, getUserId(req));
  if (!result.success) return sendError(res, result.message || "Failed", 400, result.errors);
  return sendCreated(res, result.data, result.message!);
});

export const updateToolController = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await updateTool(req.params.id as string, req.body, getUserId(req), getUserRole(req));
  if (!result.success) return sendError(res, result.message || "Failed", 400, result.errors);
  return sendSuccess(res, result.data, result.message!);
});

export const deleteToolController = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await deleteTool(req.params.id as string, getUserId(req), getUserRole(req));
  if (!result.success) return sendError(res, result.message || "Failed", 400, result.errors);
  return sendSuccess(res, null, result.message!);
});

export const getAllToolsController = catchAsync(async (_req: Request, res: Response) => {
  const result = await getAllTools();
  if (!result.success) return sendError(res, result.message || "Failed", 500, result.errors);
  return sendSuccess(res, result.data, result.message!);
});

export const getAllToolsAdminController = catchAsync(async (req: AuthRequest, res: Response) => {
  if (getUserRole(req) !== "admin") return sendError(res, "Unauthorized", 403);
  const result = await getAllToolsAdmin();
  if (!result.success) return sendError(res, result.message || "Failed", 500, result.errors);
  return sendSuccess(res, result.data, result.message!);
});

export const getToolByIdController = catchAsync(async (req: Request, res: Response) => {
  const result = await getToolById(req.params.id as string);
  if (!result.success) return sendError(res, result.message || "Not found", 404, result.errors);
  return sendSuccess(res, result.data, result.message!);
});