import { z } from "zod";
export declare const createToolSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        shortDescription: z.ZodString;
        accessLink: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        price: z.ZodDefault<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        thumbnail: z.ZodOptional<z.ZodString>;
        variations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            days: z.ZodNumber;
            price: z.ZodNumber;
        }, z.core.$strip>>>;
        status: z.ZodOptional<z.ZodEnum<{
            draft: "draft";
            published: "published";
            archived: "archived";
        }>>;
        isPackage: z.ZodOptional<z.ZodBoolean>;
        includedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateToolSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        shortDescription: z.ZodOptional<z.ZodString>;
        accessLink: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        price: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        thumbnail: z.ZodOptional<z.ZodString>;
        variations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            days: z.ZodNumber;
            price: z.ZodNumber;
        }, z.core.$strip>>>;
        status: z.ZodOptional<z.ZodEnum<{
            draft: "draft";
            published: "published";
            archived: "archived";
        }>>;
        isPackage: z.ZodOptional<z.ZodBoolean>;
        includedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getToolSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=tool.validation.d.ts.map