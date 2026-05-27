"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ToolVariationSchema = new mongoose_1.Schema({
    label: { type: String, required: true },
    days: { type: Number, required: true },
    price: { type: Number, required: true },
}, { _id: false });
const ToolSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    thumbnail: {
        public_id: { type: String, default: null },
        url: {
            type: String,
            default: "https://res.cloudinary.com/dj8fpb6tq/image/upload/v1758530649/qllwshtuqe3njr8pzim6.png",
        },
    },
    // accessLink: HTML button code string or plain URL — just non-empty for regular tools
    accessLink: {
        type: String,
        default: "",
        validate: {
            validator: function (v) {
                // Packages don't need an accessLink
                if (this.isPackage)
                    return true;
                // Regular tools just need a non-empty value (HTML button or URL)
                return !!v && v.trim().length > 0;
            },
            message: "Access button HTML is required for regular tools",
        },
    },
    price: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    variations: { type: [ToolVariationSchema], default: [] },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    instructor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    enrollmentCount: { type: Number, default: 0 },
    // Package fields
    isPackage: { type: Boolean, default: false },
    includedTools: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Tool", default: [] }],
}, { timestamps: true });
const Tool = mongoose_1.default.model("Tool", ToolSchema);
exports.default = Tool;
//# sourceMappingURL=tool.model.js.map