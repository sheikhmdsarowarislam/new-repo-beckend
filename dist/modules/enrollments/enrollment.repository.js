"use strict";
// src/modules/enrollments/enrollment.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMultipleEnrollments = exports.getEnrollmentStats = exports.createEnrollment = exports.findEnrollmentsByCourse = exports.findEnrollmentsByStudent = exports.findEnrollmentByStudentAndCourse = exports.findEnrollmentById = void 0;
const mongoose_1 = require("mongoose");
const enrollment_model_1 = __importDefault(require("./enrollment.model"));
// --- READ Operations ---
const findEnrollmentById = (enrollmentId, session) => {
    return enrollment_model_1.default.findById(enrollmentId)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findEnrollmentById = findEnrollmentById;
const findEnrollmentByStudentAndCourse = (studentId, courseId, session) => {
    return enrollment_model_1.default.findOne({ student: studentId, course: courseId })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findEnrollmentByStudentAndCourse = findEnrollmentByStudentAndCourse;
const findEnrollmentsByStudent = (studentId, session) => {
    return enrollment_model_1.default.find({ student: studentId })
        .populate('course', 'title thumbnail category level averageRating price instructor')
        .sort({ enrollmentDate: -1 }) // Use enrollmentDate instead of enrolledAt
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findEnrollmentsByStudent = findEnrollmentsByStudent;
const findEnrollmentsByCourse = (courseId, session) => {
    return enrollment_model_1.default.find({ course: courseId })
        .populate('student', 'name email avatar')
        .sort({ enrollmentDate: -1 }) // Use enrollmentDate instead of enrolledAt
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findEnrollmentsByCourse = findEnrollmentsByCourse;
// --- WRITE Operations (Only what's needed for the specified routes) ---
const createEnrollment = (data, session) => {
    return enrollment_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create enrollment document.");
        }
        return res[0];
    });
};
exports.createEnrollment = createEnrollment;
// Optimized: Get enrollment statistics for multiple courses
const getEnrollmentStats = (courseIds) => {
    return enrollment_model_1.default.aggregate([
        { $match: { course: { $in: courseIds.map(id => new mongoose_1.Types.ObjectId(id)) } } },
        {
            $group: {
                _id: '$course',
                enrollmentCount: { $sum: 1 },
                totalRevenue: { $sum: '$amountPaid' },
                paidEnrollments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
                freeEnrollments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'free'] }, 1, 0] } }
            }
        }
    ]);
};
exports.getEnrollmentStats = getEnrollmentStats;
// Optimized: Check multiple enrollments at once
const checkMultipleEnrollments = (studentId, courseIds) => {
    return enrollment_model_1.default.find({
        student: new mongoose_1.Types.ObjectId(studentId),
        course: { $in: courseIds.map(id => new mongoose_1.Types.ObjectId(id)) }
    }).select('course').lean();
};
exports.checkMultipleEnrollments = checkMultipleEnrollments;
//# sourceMappingURL=enrollment.repository.js.map