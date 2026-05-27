"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const tool_validation_1 = require("./tool.validation");
const tool_controller_1 = require("./tool.controller");
const router = (0, express_1.Router)();
router.get("/", tool_controller_1.getAllToolsController); // public
router.get("/admin/all", auth_1.isAuthenticated, tool_controller_1.getAllToolsAdminController); // admin
router.get("/:id", (0, validate_middleware_1.validate)(tool_validation_1.getToolSchema), tool_controller_1.getToolByIdController); // public
router.post("/create", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(tool_validation_1.createToolSchema), tool_controller_1.createToolController);
router.put("/:id", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(tool_validation_1.updateToolSchema), tool_controller_1.updateToolController);
router.delete("/:id", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(tool_validation_1.getToolSchema), tool_controller_1.deleteToolController);
exports.default = router;
//# sourceMappingURL=tool.routes.js.map