"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToolSchema = exports.updateToolSchema = exports.createToolSchema = void 0;
const zod_1 = require("zod");
const variationSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    days: zod_1.z.number().int().min(1),
    price: zod_1.z.number().min(0),
});
// ── Create ────────────────────────────────────────────────────────────
exports.createToolSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: zod_1.z.string().min(2, "Name required"),
        shortDescription: zod_1.z.string().min(5, "Short description required"),
        // accessLink: HTML button code or plain URL string — not URL-validated
        accessLink: zod_1.z.string().optional().or(zod_1.z.literal("")),
        price: zod_1.z.number().min(0).default(0),
        discount: zod_1.z.number().min(0).max(100).optional(),
        thumbnail: zod_1.z.string().optional(),
        variations: zod_1.z.array(variationSchema).optional(),
        status: zod_1.z.enum(["draft", "published", "archived"]).optional(),
        // Package fields
        isPackage: zod_1.z.boolean().optional(),
        includedTools: zod_1.z.array(zod_1.z.string().length(24)).optional(),
    })
        .superRefine((data, ctx) => {
        // Regular tools must have a non-empty accessLink (HTML button or URL)
        if (!data.isPackage) {
            if (!data.accessLink || data.accessLink.trim() === "") {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "Access button HTML is required for tools",
                    path: ["accessLink"],
                });
            }
        }
        // Packages must have at least one includedTool
        if (data.isPackage) {
            if (!data.includedTools || data.includedTools.length === 0) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "At least one tool must be included in a package",
                    path: ["includedTools"],
                });
            }
        }
    }),
});
// ── Update ────────────────────────────────────────────────────────────
exports.updateToolSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().length(24) }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        shortDescription: zod_1.z.string().min(5).optional(),
        // accessLink: HTML button code or plain URL string — not URL-validated
        accessLink: zod_1.z.string().optional().or(zod_1.z.literal("")),
        price: zod_1.z.number().min(0).optional(),
        discount: zod_1.z.number().min(0).max(100).optional(),
        thumbnail: zod_1.z.string().optional(),
        variations: zod_1.z.array(variationSchema).optional(),
        status: zod_1.z.enum(["draft", "published", "archived"]).optional(),
        // Package fields (can be updated too)
        isPackage: zod_1.z.boolean().optional(),
        includedTools: zod_1.z.array(zod_1.z.string().length(24)).optional(),
    }),
});
// ── Get / Delete ──────────────────────────────────────────────────────
exports.getToolSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().length(24) }),
});
//# sourceMappingURL=tool.validation.js.map