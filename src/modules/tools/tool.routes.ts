import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate.middleware";
import { createToolSchema, updateToolSchema, getToolSchema } from "./tool.validation";
import {
  createToolController,
  updateToolController,
  deleteToolController,
  getAllToolsController,
  getAllToolsAdminController,
  getToolByIdController,
} from "./tool.controller";

const router = Router();

router.get("/", getAllToolsController);                                          // public
router.get("/admin/all", isAuthenticated, getAllToolsAdminController);          // admin
router.get("/:id", validate(getToolSchema), getToolByIdController);             // public
router.post("/create", isAuthenticated, validate(createToolSchema), createToolController);
router.put("/:id", isAuthenticated, validate(updateToolSchema), updateToolController);
router.delete("/:id", isAuthenticated, validate(getToolSchema), deleteToolController);

export default router;