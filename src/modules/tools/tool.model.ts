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

    // accessLink: HTML button code string or plain URL — just non-empty for regular tools
    accessLink: {
      type: String,
      default: "",
      validate: {
        validator: function (this: ITool, v: string) {
          // Packages don't need an accessLink
          if (this.isPackage) return true;
          // Regular tools just need a non-empty value (HTML button or URL)
          return !!v && v.trim().length > 0;
        },
        message: "Access button HTML is required for regular tools",
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