import { z } from "zod";

const variationSchema = z.object({
  label: z.string().min(1),
  days:  z.number().int().min(1),
  price: z.number().min(0),
});

// ── Create ────────────────────────────────────────────────────────────
export const createToolSchema = z.object({
  body: z
    .object({
      name:             z.string().min(2, "Name required"),
      shortDescription: z.string().min(5, "Short description required"),

      // accessLink: HTML button code or plain URL string — not URL-validated
      accessLink: z.string().optional().or(z.literal("")),

      price:      z.number().min(0).default(0),
      discount:   z.number().min(0).max(100).optional(),
      thumbnail:  z.string().optional(),
      variations: z.array(variationSchema).optional(),
      status:     z.enum(["draft", "published", "archived"]).optional(),

      // Package fields
      isPackage:     z.boolean().optional(),
      includedTools: z.array(z.string().length(24)).optional(),
    })
    .superRefine((data, ctx) => {
      // Regular tools must have a non-empty accessLink (HTML button or URL)
      if (!data.isPackage) {
        if (!data.accessLink || data.accessLink.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Access button HTML is required for tools",
            path: ["accessLink"],
          });
        }
      }
      // Packages must have at least one includedTool
      if (data.isPackage) {
        if (!data.includedTools || data.includedTools.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one tool must be included in a package",
            path: ["includedTools"],
          });
        }
      }
    }),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateToolSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
  body: z.object({
    name:             z.string().min(2).optional(),
    shortDescription: z.string().min(5).optional(),
    // accessLink: HTML button code or plain URL string — not URL-validated
    accessLink:       z.string().optional().or(z.literal("")),
    price:            z.number().min(0).optional(),
    discount:         z.number().min(0).max(100).optional(),
    thumbnail:        z.string().optional(),
    variations:       z.array(variationSchema).optional(),
    status:           z.enum(["draft", "published", "archived"]).optional(),

    // Package fields (can be updated too)
    isPackage:     z.boolean().optional(),
    includedTools: z.array(z.string().length(24)).optional(),
  }),
});

// ── Get / Delete ──────────────────────────────────────────────────────
export const getToolSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
});