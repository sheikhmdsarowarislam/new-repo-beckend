"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const config_1 = __importDefault(require("./config"));
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary_cloud_name,
    api_key: config_1.default.cloudinary_api_key,
    api_secret: config_1.default.cloudinary_api_secret,
});
const PORT = config_1.default.port || 8000;
const startServer = async () => {
    await (0, db_1.default)();
    app_1.default.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};
startServer();
//# sourceMappingURL=server.js.map