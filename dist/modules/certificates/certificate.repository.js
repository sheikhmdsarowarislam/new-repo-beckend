"use strict";
// src/modules/certificates/certificate.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCertificateById = exports.createCertificate = exports.findCertificatesByUser = exports.findCertificateByUserAndCourse = exports.findCertificateById = void 0;
const certificate_model_1 = __importDefault(require("./certificate.model"));
// --- READ Operations ---
const findCertificateById = (certificateId, session) => {
    return certificate_model_1.default.findOne({ certificateId })
        .populate('course', 'title instructor')
        .populate('user', 'name email')
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findCertificateById = findCertificateById;
const findCertificateByUserAndCourse = (userId, courseId, session) => {
    return certificate_model_1.default.findOne({ user: userId, course: courseId })
        .populate('course', 'title instructor')
        .populate('user', 'name email')
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findCertificateByUserAndCourse = findCertificateByUserAndCourse;
const findCertificatesByUser = (userId, options = {}, session) => {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    return certificate_model_1.default.find({ user: userId })
        .populate('course', 'title thumbnail instructor')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findCertificatesByUser = findCertificatesByUser;
// --- WRITE Operations ---
const createCertificate = (data, session) => {
    return certificate_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create certificate document.");
        }
        return res[0];
    });
};
exports.createCertificate = createCertificate;
const deleteCertificateById = (certificateId, session) => {
    return certificate_model_1.default.findOneAndDelete({ certificateId })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.deleteCertificateById = deleteCertificateById;
// --- AGGREGATION Operations ---
//# sourceMappingURL=certificate.repository.js.map