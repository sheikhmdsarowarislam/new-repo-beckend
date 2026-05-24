import mongoose, { Schema, Document } from "mongoose";

export interface IToolVariation {
  label: string;  // e.g. "1 Month", "1 Year"
  days: number;   // e.g. 30, 365
  price: number;
}

export interface ITool extends Document {
  name: string;
  shortDescription: string;
  thumbnail: {
    public_id: string | null;
    url: string;
  };
  accessLink: string;
  price: number;
  discount: number;
  variations: IToolVariation[];
  status: "draft" | "published" | "archived";
  instructor: mongoose.Types.ObjectId;
  enrollmentCount: number;

  // ── Package-specific fields ──────────────────────────────────────────
  isPackage: boolean;
  includedTools: mongoose.Types.ObjectId[];  // refs to Tool documents

  createdAt: Date;
  updatedAt: Date;
}

const ToolVariationSchema = new Schema<IToolVariation>(
  {
    label: { type: String, required: true },
    days:  { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const ToolSchema = new Schema<ITool>(
  {
    name:             { type: String, required: true },
    shortDescription: { type: String, required: true },
    thumbnail: {
      public_id: { type: String, default: null },
      url: {
        type: String,
        default: "https://res.cloudinary.com/dj8fpb6tq/image/upload/v1758530649/qllwshtuqe3njr8pzim6.png",
      },
    },

    // accessLink: required only for regular tools, not packages
    accessLink: {
      type: String,
      default: "",
      validate: {
        validator: function (this: ITool, v: string) {
          // If it's a package, accessLink can be empty
          if (this.isPackage) return true;
          // For regular tools, must be a valid URL
          if (!v) return false;
          try { new URL(v); return true; } catch { return false; }
        },
        message: "Must be a valid URL",
      },
    },

    price:           { type: Number, default: 0 },
    discount:        { type: Number, default: 0, min: 0, max: 100 },
    variations:      { type: [ToolVariationSchema], default: [] },
    status:          { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    instructor:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrollmentCount: { type: Number, default: 0 },

    // Package fields
    isPackage:     { type: Boolean, default: false },
    includedTools: [{ type: Schema.Types.ObjectId, ref: "Tool", default: [] }],
  },
  { timestamps: true }
);

const Tool = mongoose.model<ITool>("Tool", ToolSchema);
export default Tool;