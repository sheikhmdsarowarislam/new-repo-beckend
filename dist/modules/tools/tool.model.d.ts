import mongoose, { Document } from "mongoose";
export interface IToolVariation {
    label: string;
    days: number;
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
    isPackage: boolean;
    includedTools: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
declare const Tool: mongoose.Model<ITool, {}, {}, {}, mongoose.Document<unknown, {}, ITool, {}, {}> & ITool & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Tool;
//# sourceMappingURL=tool.model.d.ts.map