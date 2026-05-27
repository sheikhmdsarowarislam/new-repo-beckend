"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTools = exports.checkToolEnrollmentStatus = exports.submitToolPayment = exports.getStudentsByInstructor = exports.getInstructorDashboardData = exports.checkEnrollmentStatus = exports.getEnrolledCourseDetails = exports.getEnrolledCoursesByUser = exports.calculateFinalPrice = exports.processEnrollment = exports.getPendingEnrollments = exports.rejectEnrollment = exports.approveEnrollment = exports.submitManualPayment = void 0;
const mongoose_1 = require("mongoose");
const withTransaction_1 = require("../../utils/withTransaction");
const enrollment_model_1 = __importDefault(require("./enrollment.model"));
const course_model_1 = __importDefault(require("../courses/course.model"));
const errorHandler_1 = require("../../utils/errorHandler");
const cache_1 = require("../../utils/cache");
const user_model_1 = __importDefault(require("../users/user.model"));
const email_1 = require("../../utils/email");
const coupon_model_1 = __importDefault(require("../coupons/coupon.model"));
const progress_model_1 = __importDefault(require("../progress/progress.model"));
const lecture_model_1 = __importDefault(require("../lectures/lecture.model"));
const quiz_model_1 = __importDefault(require("../quizes/quiz.model"));
const notification_service_1 = require("../notifications/notification.service");
const tool_model_1 = __importDefault(require("../tools/tool.model"));
// ─────────────────────────────────────────────
// SUBMIT MANUAL BKASH PAYMENT (student action)
// ─────────────────────────────────────────────
const submitManualPayment = async ({ studentId, courseId, transactionId, couponCode, }) => {
    try {
        const existingEnrollment = await enrollment_model_1.default.findOne({
            student: new mongoose_1.Types.ObjectId(studentId),
            course: new mongoose_1.Types.ObjectId(courseId),
        });
        if (existingEnrollment) {
            return { success: false, message: "You are already enrolled in this course.", errors: [] };
        }
        const priceResult = await (0, exports.calculateFinalPrice)(courseId, couponCode);
        if (!priceResult.success) {
            return { success: false, message: priceResult.message, errors: priceResult.errors };
        }
        const { finalPrice, coupon, course } = priceResult.data;
        const validCoupon = coupon;
        const couponId = validCoupon ? validCoupon._id.toString() : undefined;
        if (finalPrice <= 0) {
            return await (0, exports.processEnrollment)({
                studentId,
                courseId,
                amountPaid: 0,
                paymentStatus: "free",
                paymentMethod: "free",
                couponId,
            });
        }
        const enrollment = await (0, withTransaction_1.withTransaction)(async (session) => {
            const enrollmentData = {
                student: studentId,
                course: courseId,
                amountPaid: finalPrice,
                paymentStatus: "pending",
                paymentMethod: "bkash",
                transactionId: transactionId.trim(),
                coupon: couponId,
            };
            const newEnrollment = await enrollment_model_1.default.create([enrollmentData], { session });
            const [student, courseDoc] = await Promise.all([
                user_model_1.default.findById(studentId).select("name email").lean(),
                course_model_1.default.findById(courseId).select("title instructor").lean(),
            ]);
            if (student && courseDoc?.instructor) {
                (0, notification_service_1.createNotification)(courseDoc.instructor.toString(), "new_enrollment_pending", `Pending payment: ${student.name} submitted bKash TxID ${transactionId} for ${courseDoc.title}`, courseId).catch((err) => console.error("Notification failed:", err?.message));
            }
            return newEnrollment[0];
        });
        return {
            success: true,
            data: enrollment,
            message: "Payment submitted successfully. Your enrollment will be activated within 10–15 minutes after verification.",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to submit payment", errors: [error.message] };
    }
};
exports.submitManualPayment = submitManualPayment;
// ─────────────────────────────────────────────
// APPROVE ENROLLMENT (admin action)
// ─────────────────────────────────────────────
const approveEnrollment = async (enrollmentId, adminId, validityDays) => {
    try {
        const enrollment = await enrollment_model_1.default.findById(enrollmentId);
        if (!enrollment) {
            return { success: false, message: "Enrollment not found.", errors: [] };
        }
        if (enrollment.paymentStatus !== "pending") {
            return {
                success: false,
                message: `Cannot approve enrollment with status "${enrollment.paymentStatus}".`,
                errors: [],
            };
        }
        const validUntil = validityDays && validityDays > 0
            ? new Date(Date.now() + validityDays * 86_400_000)
            : null;
        enrollment.paymentStatus = "paid";
        enrollment.approvedBy = new mongoose_1.Types.ObjectId(adminId);
        enrollment.approvedAt = new Date();
        if (validUntil)
            enrollment.validUntil = validUntil;
        await enrollment.save();
        // ── Package: শুধু included tools add হবে, package নিজে dashboard এ আসবে না ──
        // ── Package: সব included tools add হবে ──
        // ── Package: সব included tools add হবে ──
        if (enrollment.tool) {
            const purchasedTool = await tool_model_1.default.findById(enrollment.tool).lean();
            if (purchasedTool?.isPackage && purchasedTool.includedTools?.length > 0) {
                for (const includedToolId of purchasedTool.includedTools) {
                    try {
                        const existingEnrollment = await enrollment_model_1.default.findOne({
                            student: enrollment.student,
                            tool: new mongoose_1.Types.ObjectId(includedToolId.toString()),
                        });
                        if (existingEnrollment) {
                            // আগে থেকে আছে — status যাই হোক update করো
                            await enrollment_model_1.default.findByIdAndUpdate(existingEnrollment._id, {
                                paymentStatus: "paid",
                                paymentMethod: "free",
                                amountPaid: 0,
                                approvedBy: new mongoose_1.Types.ObjectId(adminId),
                                approvedAt: new Date(),
                                validUntil: validUntil || null,
                                sourcePackage: enrollment.tool,
                            });
                        }
                        else {
                            // নতুন করে create করো
                            await enrollment_model_1.default.create({
                                student: enrollment.student,
                                tool: new mongoose_1.Types.ObjectId(includedToolId.toString()),
                                itemType: "tool",
                                amountPaid: 0,
                                paymentStatus: "paid",
                                paymentMethod: "free",
                                approvedBy: new mongoose_1.Types.ObjectId(adminId),
                                approvedAt: new Date(),
                                validUntil: validUntil || null,
                                sourcePackage: enrollment.tool,
                            });
                        }
                    }
                    catch (err) {
                        console.error(`Tool enrollment failed for ${includedToolId}:`, err?.message);
                    }
                }
            }
        }
        // enrollmentCount update
        if (enrollment.course) {
            await course_model_1.default.updateOne({ _id: enrollment.course }, { $inc: { enrollmentCount: 1 } });
        }
        if (enrollment.tool) {
            await tool_model_1.default.updateOne({ _id: enrollment.tool }, { $inc: { enrollmentCount: 1 } });
        }
        await Promise.all([
            (0, cache_1.invalidateCache)(`course:${enrollment.course}`),
            (0, cache_1.invalidateCache)("courses:list"),
        ]).catch((err) => console.error("Cache invalidation failed:", err));
        const [student, course, tool] = await Promise.all([
            user_model_1.default.findById(enrollment.student).select("name email").lean(),
            enrollment.course ? course_model_1.default.findById(enrollment.course).select("title instructor").lean() : null,
            enrollment.tool ? tool_model_1.default.findById(enrollment.tool).select("name").lean() : null,
        ]);
        const itemTitle = course?.title || tool?.name || "Unknown";
        if (student && (course || tool)) {
            (0, email_1.sendEmail)(student.email, "Enrollment Approved - CodeTutor LMS", "enrollment", {
                studentName: student.name,
                courseTitle: itemTitle,
                dashboardUrl: process.env.FRONTEND_URL + "/dashboard",
                ...(validUntil && { validUntil: validUntil.toLocaleDateString("en-BD") }),
            }).catch((err) => console.error("Email send failed:", err?.message));
            (0, notification_service_1.createNotification)(enrollment.student.toString(), "enrollment_approved", `Your enrollment in "${itemTitle}" has been approved!${validUntil ? ` Access valid until ${validUntil.toLocaleDateString()}.` : ""}`, enrollment.course?.toString() || enrollment.tool?.toString()).catch(console.error);
        }
        if (course?.instructor) {
            await (0, cache_1.invalidateCache)(`instructor:dashboard:${course.instructor}`).catch(console.error);
        }
        return { success: true, data: enrollment, message: "Enrollment approved successfully." };
    }
    catch (error) {
        return { success: false, message: "Failed to approve enrollment.", errors: [error.message] };
    }
};
exports.approveEnrollment = approveEnrollment;
// ─────────────────────────────────────────────
// REJECT ENROLLMENT (admin action)
// ─────────────────────────────────────────────
const rejectEnrollment = async (enrollmentId, adminId, reason) => {
    try {
        const enrollment = await enrollment_model_1.default.findById(enrollmentId);
        if (!enrollment) {
            return { success: false, message: "Enrollment not found.", errors: [] };
        }
        if (enrollment.paymentStatus !== "pending") {
            return {
                success: false,
                message: `Cannot reject enrollment with status "${enrollment.paymentStatus}".`,
                errors: [],
            };
        }
        enrollment.paymentStatus = "rejected";
        enrollment.approvedBy = new mongoose_1.Types.ObjectId(adminId);
        enrollment.rejectedAt = new Date();
        enrollment.rejectionReason = reason || "Payment could not be verified.";
        await enrollment.save();
        const [student, course] = await Promise.all([
            user_model_1.default.findById(enrollment.student).select("name email").lean(),
            course_model_1.default.findById(enrollment.course).select("title").lean(),
        ]);
        if (student && course) {
            (0, email_1.sendEmail)(student.email, "Enrollment Update - CodeTutor LMS", "enrollment_rejected", {
                studentName: student.name,
                courseTitle: course.title,
                reason: enrollment.rejectionReason,
                supportUrl: process.env.FRONTEND_URL + "/support",
            }).catch((err) => console.error("Email send failed:", err?.message));
            (0, notification_service_1.createNotification)(enrollment.student.toString(), "enrollment_rejected", `Your enrollment in "${course.title}" was rejected. Reason: ${enrollment.rejectionReason}`, enrollment.course?.toString()).catch(console.error);
        }
        return { success: true, data: enrollment, message: "Enrollment rejected." };
    }
    catch (error) {
        return { success: false, message: "Failed to reject enrollment.", errors: [error.message] };
    }
};
exports.rejectEnrollment = rejectEnrollment;
// ─────────────────────────────────────────────
// GET ALL PENDING ENROLLMENTS (admin panel)
// ─────────────────────────────────────────────
const getPendingEnrollments = async () => {
    try {
        const enrollments = await enrollment_model_1.default.find({ paymentStatus: "pending" })
            .populate("student", "name email avatar")
            .populate("course", "title thumbnail price")
            .populate("tool", "name thumbnail price")
            .sort({ createdAt: -1 })
            .lean();
        return {
            success: true,
            data: { enrollments, count: enrollments.length },
            message: "Pending enrollments retrieved successfully.",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve pending enrollments.", errors: [error.message] };
    }
};
exports.getPendingEnrollments = getPendingEnrollments;
// ─────────────────────────────────────────────
// INTERNAL: processEnrollment (free courses)
// ─────────────────────────────────────────────
const processEnrollment = async ({ studentId, courseId, amountPaid, paymentStatus, paymentMethod = "free", couponId, }) => {
    try {
        const enrollment = await (0, withTransaction_1.withTransaction)(async (session) => {
            const existingEnrollment = await enrollment_model_1.default.findOne({
                student: new mongoose_1.Types.ObjectId(studentId),
                course: new mongoose_1.Types.ObjectId(courseId),
            }).session(session);
            if (existingEnrollment)
                return existingEnrollment;
            await course_model_1.default.updateOne({ _id: courseId }, { $inc: { enrollmentCount: 1 } }, { session });
            const courseCheck = await course_model_1.default.findById(courseId).session(session);
            if (!courseCheck)
                throw (0, errorHandler_1.createError)("Course not found during enrollment.", 404);
            const newEnrollment = await enrollment_model_1.default.create([{ student: studentId, course: courseId, amountPaid, paymentStatus, paymentMethod, coupon: couponId }], { session });
            const [, student, course] = await Promise.all([
                Promise.all([
                    (0, cache_1.invalidateCache)(`course:${courseId}`),
                    (0, cache_1.invalidateCache)("courses:list"),
                ]).catch((err) => console.error("Cache invalidation failed:", err)),
                user_model_1.default.findById(studentId).select("name email").lean(),
                course_model_1.default.findById(courseId).select("title instructor").lean(),
            ]);
            if (course?.instructor) {
                await (0, cache_1.invalidateCache)(`instructor:dashboard:${course.instructor}`).catch(console.error);
            }
            if (student && course) {
                (0, email_1.sendEmail)(student.email, "Enrollment Confirmed - CodeTutor LMS", "enrollment", {
                    studentName: student.name,
                    courseTitle: course.title,
                    dashboardUrl: process.env.FRONTEND_URL + "/dashboard",
                }).catch((err) => console.error("Email send failed:", err?.message));
                (0, notification_service_1.createNotification)(course.instructor.toString(), "new_enrollment", `${student.name} enrolled in ${course.title}`, courseId).catch(console.error);
            }
            return newEnrollment[0];
        });
        return { success: true, data: enrollment, message: "Enrollment processed successfully." };
    }
    catch (error) {
        return { success: false, message: "Enrollment processing failed.", errors: [error.message] };
    }
};
exports.processEnrollment = processEnrollment;
// ─────────────────────────────────────────────
// calculateFinalPrice
// ─────────────────────────────────────────────
const calculateFinalPrice = async (courseId, couponCode) => {
    try {
        const cacheKey = `course:${courseId}`;
        let course;
        const cachedCourse = await (0, cache_1.getCache)(cacheKey);
        if (cachedCourse) {
            course = cachedCourse;
        }
        else {
            let objectId;
            try {
                objectId = new mongoose_1.Types.ObjectId(courseId);
            }
            catch {
                throw new errorHandler_1.AppError("Invalid courseId format.", 400);
            }
            const dbCourse = await course_model_1.default.findById(objectId).lean();
            if (!dbCourse)
                throw new errorHandler_1.AppError("Course not found", 404);
            course = dbCourse;
            await (0, cache_1.setCache)(cacheKey, course, 60 * 60);
        }
        let finalPrice = course.price;
        if (course.discount && course.discount > 0) {
            finalPrice = finalPrice - (finalPrice * course.discount) / 100;
            finalPrice = Math.round(finalPrice * 100) / 100;
        }
        let coupon = null;
        if (couponCode) {
            coupon = await coupon_model_1.default.findOne({ code: couponCode.toUpperCase(), isActive: true });
            const now = new Date();
            if (!coupon || (coupon.expiresAt && coupon.expiresAt < now)) {
                throw new errorHandler_1.AppError("Invalid or expired coupon", 400);
            }
            const appliesToValue = coupon.appliesTo;
            let couponAppliesToId = "";
            if (appliesToValue instanceof mongoose_1.Types.ObjectId) {
                couponAppliesToId = appliesToValue.toString();
            }
            else if (typeof appliesToValue === "string") {
                couponAppliesToId = appliesToValue;
            }
            if (couponAppliesToId !== "all" && couponAppliesToId !== courseId) {
                throw new errorHandler_1.AppError("Coupon not valid for this course.", 400);
            }
            finalPrice = finalPrice - (finalPrice * coupon.discountValue) / 100;
            finalPrice = Math.round(finalPrice * 100) / 100;
        }
        return {
            success: true,
            data: { finalPrice: Math.round(finalPrice * 100) / 100, coupon, course },
            message: "Price calculated successfully",
        };
    }
    catch (error) {
        return { success: false, message: "Price calculation failed", errors: [error.message] };
    }
};
exports.calculateFinalPrice = calculateFinalPrice;
// ─────────────────────────────────────────────
// GET ENROLLED COURSES BY USER
// ─────────────────────────────────────────────
const getEnrolledCoursesByUser = async (userId) => {
    try {
        const enrollments = await enrollment_model_1.default.aggregate([
            { $match: { student: new mongoose_1.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "courses",
                    localField: "course",
                    foreignField: "_id",
                    as: "course",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "instructor",
                                foreignField: "_id",
                                as: "instructor",
                                pipeline: [{ $project: { name: 1, avatar: 1 } }],
                            },
                        },
                        {
                            $project: {
                                title: 1,
                                price: 1,
                                thumbnail: 1,
                                totalDuration: 1,
                                updatedAt: 1,
                                instructor: { $arrayElemAt: ["$instructor", 0] },
                            },
                        },
                    ],
                },
            },
            { $unwind: "$course" },
            {
                $project: {
                    _id: 1,
                    course: 1,
                    enrolledAt: 1,
                    amountPaid: 1,
                    paymentStatus: 1,
                    paymentMethod: 1,
                    transactionId: 1,
                    validUntil: 1,
                },
            },
        ]);
        const courseIds = enrollments.map((e) => e.course._id);
        const [lectureStats, quizStats, progressStats] = await Promise.all([
            lecture_model_1.default.aggregate([
                { $match: { course: { $in: courseIds } } },
                { $group: { _id: "$course", count: { $sum: 1 } } },
            ]),
            quiz_model_1.default.aggregate([
                { $match: { course: { $in: courseIds } } },
                { $group: { _id: "$course", count: { $sum: 1 } } },
            ]),
            progress_model_1.default.find({ user: userId, course: { $in: courseIds } })
                .select("course totalLecturesCompleted totalQuizzesCompleted completionPercentage")
                .lean(),
        ]);
        const lectureCountMap = new Map(lectureStats.map((s) => [s._id.toString(), s.count]));
        const quizCountMap = new Map(quizStats.map((s) => [s._id.toString(), s.count]));
        const progressMap = new Map(progressStats.map((p) => [p.course.toString(), p]));
        const now = new Date();
        const enrolledCourses = enrollments.map((enrollment) => {
            const course = enrollment.course;
            const courseId = course._id.toString();
            const lectureCount = lectureCountMap.get(courseId) || 0;
            const quizCount = quizCountMap.get(courseId) || 0;
            const progress = progressMap.get(courseId);
            const totalItems = lectureCount + quizCount;
            const completedLectures = progress?.totalLecturesCompleted || 0;
            const completedQuizzes = progress?.totalQuizzesCompleted || 0;
            const totalCompletedItems = completedLectures + completedQuizzes;
            const completionPercentage = totalItems > 0 ? Math.round((totalCompletedItems / totalItems) * 100) : 0;
            const isCourseFullyCompleted = completedLectures >= lectureCount &&
                (quizCount === 0 || progress?.quizzesCompleted === true);
            const isExpired = enrollment.paymentStatus === "paid" &&
                enrollment.validUntil &&
                now > new Date(enrollment.validUntil);
            return {
                _id: course._id,
                title: course.title,
                thumbnail: course.thumbnail,
                instructor: { name: course.instructor?.name || "Unknown", avatar: course.instructor?.avatar || null },
                price: course.price,
                totalDuration: course.totalDuration,
                enrollmentDate: enrollment.enrollmentDate,
                paymentStatus: isExpired ? "expired" : enrollment.paymentStatus,
                paymentMethod: enrollment.paymentMethod,
                amountPaid: enrollment.amountPaid,
                enrollmentId: enrollment._id,
                updatedAt: course.updatedAt,
                validUntil: enrollment.validUntil || null,
                isExpired: !!isExpired,
                progress: {
                    totalLectures: lectureCount,
                    completedLectures,
                    totalQuizzes: quizCount,
                    completedQuizzes,
                    totalItems,
                    completedItems: totalCompletedItems,
                    completionPercentage,
                    quizzesCompleted: progress?.quizzesCompleted || false,
                    averageQuizScore: progress?.averageQuizScore || 0,
                    isCourseCompleted: isCourseFullyCompleted,
                },
            };
        });
        const totalCoursesCompleted = enrolledCourses.filter((c) => c.progress.isCourseCompleted).length;
        const totalRewardPoints = enrolledCourses.reduce((total, c) => {
            return (total +
                c.progress.completedLectures * 10 +
                c.progress.completedQuizzes * 20 +
                (c.progress.isCourseCompleted ? 50 : 0));
        }, 0);
        return {
            success: true,
            data: { enrolledCourses, totalCoursesCompleted, totalRewardPoints },
            message: "Enrolled courses retrieved successfully",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve enrolled courses", errors: [error.message] };
    }
};
exports.getEnrolledCoursesByUser = getEnrolledCoursesByUser;
// ─────────────────────────────────────────────
// GET ENROLLED COURSE DETAILS
// ─────────────────────────────────────────────
const getEnrolledCourseDetails = async (courseId, userId) => {
    try {
        const enrollment = await enrollment_model_1.default.findOne({
            student: new mongoose_1.Types.ObjectId(userId),
            course: new mongoose_1.Types.ObjectId(courseId),
        }).lean();
        if (!enrollment)
            throw (0, errorHandler_1.createError)("Course not found or not enrolled", 404);
        if (enrollment.paymentStatus === "pending") {
            return {
                success: false,
                message: "Your payment is pending approval. Please wait 10–15 minutes.",
                errors: ["PAYMENT_PENDING"],
            };
        }
        if (enrollment.paymentStatus === "rejected") {
            return {
                success: false,
                message: "Your payment was rejected. Please contact support.",
                errors: ["PAYMENT_REJECTED"],
            };
        }
        if (enrollment.paymentStatus === "paid" &&
            enrollment.validUntil &&
            new Date() > new Date(enrollment.validUntil)) {
            await enrollment_model_1.default.updateOne({ _id: enrollment._id }, { paymentStatus: "expired" });
            return {
                success: false,
                message: "Your enrollment has expired. Please re-enroll to continue.",
                errors: ["ENROLLMENT_EXPIRED"],
            };
        }
        const result = await course_model_1.default.aggregate([
            { $match: { _id: new mongoose_1.Types.ObjectId(courseId) } },
            {
                $lookup: {
                    from: "chapters",
                    localField: "_id",
                    foreignField: "course",
                    as: "chapters",
                    pipeline: [
                        { $sort: { order: 1 } },
                        {
                            $lookup: {
                                from: "lectures",
                                localField: "_id",
                                foreignField: "chapter",
                                as: "lectures",
                                pipeline: [{ $sort: { order: 1 } }],
                            },
                        },
                        {
                            $lookup: {
                                from: "quizzes",
                                localField: "_id",
                                foreignField: "chapter",
                                as: "quizzes",
                                pipeline: [{ $sort: { order: 1 } }],
                            },
                        },
                        {
                            $addFields: {
                                items: {
                                    $concatArrays: [
                                        {
                                            $map: {
                                                input: "$lectures",
                                                as: "lec",
                                                in: {
                                                    type: "lecture",
                                                    lectureId: "$$lec._id",
                                                    lectureTitle: "$$lec.title",
                                                    lectureUrl: "$$lec.videoUrl",
                                                    lectureDuration: "$$lec.duration",
                                                    isPreview: "$$lec.isPreview",
                                                    resources: "$$lec.resources",
                                                    order: "$$lec.order",
                                                },
                                            },
                                        },
                                        {
                                            $map: {
                                                input: "$quizzes",
                                                as: "quiz",
                                                in: {
                                                    type: "quiz",
                                                    quizId: "$$quiz._id",
                                                    lectureTitle: "$$quiz.title",
                                                    questionCount: { $size: "$$quiz.questions" },
                                                    questions: "$$quiz.questions",
                                                    order: "$$quiz.order",
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $addFields: {
                                items: { $sortArray: { input: "$items", sortBy: { order: 1 } } },
                            },
                        },
                        { $project: { lectures: 0, quizzes: 0 } },
                    ],
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "instructor",
                    foreignField: "_id",
                    as: "instructorData",
                    pipeline: [{ $project: { _id: 1, name: 1, avatar: 1, bio: 1 } }],
                },
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    whatYouWillLearn: 1,
                    category: 1,
                    level: 1,
                    thumbnail: 1,
                    instructor: { $arrayElemAt: ["$instructorData", 0] },
                    courseContent: {
                        $map: {
                            input: "$chapters",
                            as: "chapter",
                            in: {
                                chapterId: "$$chapter._id",
                                chapterTitle: "$$chapter.title",
                                chapterContent: "$$chapter.items",
                            },
                        },
                    },
                },
            },
        ]);
        if (!result || result.length === 0)
            throw new errorHandler_1.AppError("Course not found", 404);
        const [progress, lectureCount, quizCount] = await Promise.all([
            progress_model_1.default.findOne({
                user: new mongoose_1.Types.ObjectId(userId),
                course: new mongoose_1.Types.ObjectId(courseId),
            }).lean(),
            lecture_model_1.default.countDocuments({ course: courseId }),
            quiz_model_1.default.countDocuments({ course: courseId }),
        ]);
        const totalItems = lectureCount + quizCount;
        const completedLectures = progress?.totalLecturesCompleted || 0;
        const completedQuizzes = progress?.totalQuizzesCompleted || 0;
        const totalCompletedItems = completedLectures + completedQuizzes;
        const completionPercentage = totalItems > 0 ? Math.round((totalCompletedItems / totalItems) * 100) : 0;
        const isCourseCompleted = completedLectures >= lectureCount &&
            (quizCount === 0 || progress?.quizzesCompleted === true);
        const lecturePoints = completedLectures * 10;
        const quizPoints = completedQuizzes * 20;
        const completionBonus = isCourseCompleted ? 50 : 0;
        let completedLectureIds = new Set();
        let completedQuizIds = new Set();
        if (progress?.completedLectures) {
            completedLectureIds = new Set(Object.keys(progress.completedLectures));
        }
        if (progress?.completedQuizzes) {
            completedQuizIds = new Set(Object.keys(progress.completedQuizzes));
        }
        const courseContent = result[0].courseContent.map((chapter) => ({
            ...chapter,
            chapterContent: chapter.chapterContent.map((item) => ({
                ...item,
                isCompleted: item.type === "lecture"
                    ? completedLectureIds.has(item.lectureId?.toString())
                    : completedQuizIds.has(item.quizId?.toString()),
            })),
        }));
        return {
            success: true,
            data: {
                _id: result[0]._id,
                title: result[0].title,
                description: result[0].description,
                whatYouWillLearn: result[0].whatYouWillLearn,
                category: result[0].category,
                level: result[0].level,
                instructor: result[0].instructor,
                courseTitle: result[0].title,
                courseThumbnail: result[0].thumbnail,
                courseContent,
                isEnrolled: true,
                enrollmentDate: enrollment.enrollmentDate,
                paymentStatus: enrollment.paymentStatus,
                paymentMethod: enrollment.paymentMethod,
                amountPaid: enrollment.amountPaid,
                enrollmentId: enrollment._id,
                validUntil: enrollment.validUntil || null,
                progress: {
                    totalLectures: lectureCount,
                    completedLectures,
                    totalQuizzes: quizCount,
                    completedQuizzes,
                    totalItems,
                    completedItems: totalCompletedItems,
                    completionPercentage,
                    quizzesCompleted: progress?.quizzesCompleted || false,
                    averageQuizScore: progress?.averageQuizScore || 0,
                    isCourseCompleted,
                    lastViewedLecture: progress?.lastViewedLecture || null,
                    completedLectureIds: progress?.completedLectures || {},
                    completedQuizIds: progress?.completedQuizzes || {},
                    rewardPoints: {
                        lecturePoints,
                        quizPoints,
                        completionBonus,
                        totalPoints: lecturePoints + quizPoints + completionBonus,
                    },
                },
            },
            message: "Enrolled course details retrieved successfully",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve enrolled course details", errors: [error.message] };
    }
};
exports.getEnrolledCourseDetails = getEnrolledCourseDetails;
// ─────────────────────────────────────────────
// CHECK ENROLLMENT STATUS
// ─────────────────────────────────────────────
const checkEnrollmentStatus = async (courseId, userId) => {
    try {
        const enrollment = await enrollment_model_1.default.findOne({
            student: new mongoose_1.Types.ObjectId(userId),
            course: new mongoose_1.Types.ObjectId(courseId),
        })
            .select("paymentStatus paymentMethod transactionId validUntil")
            .lean();
        const isExpired = enrollment?.paymentStatus === "paid" &&
            enrollment.validUntil &&
            new Date() > new Date(enrollment.validUntil);
        return {
            success: true,
            data: {
                isEnrolled: !!enrollment && !isExpired,
                paymentStatus: isExpired ? "expired" : (enrollment?.paymentStatus || null),
                paymentMethod: enrollment?.paymentMethod || null,
                validUntil: enrollment?.validUntil || null,
            },
            message: "Enrollment status checked successfully",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to check enrollment status", errors: [error.message] };
    }
};
exports.checkEnrollmentStatus = checkEnrollmentStatus;
// ─────────────────────────────────────────────
// GET INSTRUCTOR DASHBOARD DATA
// ─────────────────────────────────────────────
const getInstructorDashboardData = async (instructorId) => {
    try {
        const coursesWithStats = await course_model_1.default.aggregate([
            { $match: { instructor: new mongoose_1.Types.ObjectId(instructorId) } },
            {
                $lookup: {
                    from: "enrollments",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$course", "$$courseId"] },
                                paymentStatus: { $in: ["paid", "free"] },
                            },
                        },
                    ],
                    as: "enrollments",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "instructor",
                    foreignField: "_id",
                    as: "instructorData",
                    pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
                },
            },
            {
                $addFields: {
                    instructor: { $arrayElemAt: ["$instructorData", 0] },
                    actualEnrollmentCount: { $size: "$enrollments" },
                    actualRevenue: { $sum: "$enrollments.amountPaid" },
                },
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    price: 1,
                    discount: 1,
                    thumbnail: 1,
                    category: 1,
                    level: 1,
                    status: 1,
                    stacks: 1,
                    requirements: 1,
                    whatYouWillLearn: 1,
                    enrollmentCount: "$actualEnrollmentCount",
                    averageRating: 1,
                    reviewCount: 1,
                    totalDuration: 1,
                    instructor: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    actualRevenue: 1,
                    isPublished: { $eq: ["$status", "published"] },
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
        if (coursesWithStats.length === 0) {
            return {
                success: true,
                data: {
                    courses: [],
                    stats: { totalCourses: 0, totalStudents: 0, totalRevenue: 0, avgRating: 0, totalEnrollments: 0, publishedCourses: 0, draftCourses: 0 },
                },
                message: "No courses found",
            };
        }
        const allEnrollments = await enrollment_model_1.default.find({
            course: { $in: coursesWithStats.map((c) => c._id) },
            paymentStatus: { $in: ["paid", "free"] },
        })
            .select("student")
            .lean();
        const uniqueStudents = new Set(allEnrollments.map((e) => e.student.toString())).size;
        const totalRevenue = coursesWithStats.reduce((sum, c) => sum + (c.actualRevenue || 0), 0);
        const coursesWithRatings = coursesWithStats.filter((c) => c.reviewCount > 0);
        const avgRating = coursesWithRatings.length > 0
            ? coursesWithRatings.reduce((sum, c) => sum + (c.averageRating || 0), 0) / coursesWithRatings.length
            : 0;
        return {
            success: true,
            data: {
                totalCourses: coursesWithStats.length,
                totalStudents: uniqueStudents,
                totalRevenue,
                averageRating: avgRating,
                totalReviews: coursesWithRatings.reduce((sum, c) => sum + (c.reviewCount || 0), 0),
                courses: coursesWithStats,
            },
            message: "Instructor dashboard data retrieved successfully",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve instructor dashboard data", errors: [error.message] };
    }
};
exports.getInstructorDashboardData = getInstructorDashboardData;
// ─────────────────────────────────────────────
// GET STUDENTS BY INSTRUCTOR
// ─────────────────────────────────────────────
const getStudentsByInstructor = async (instructorId) => {
    try {
        const instructorCourses = await course_model_1.default.find({ instructor: instructorId })
            .select("_id title")
            .lean();
        const courseIds = instructorCourses.map((c) => c._id);
        if (courseIds.length === 0) {
            return {
                success: true,
                data: { students: [], totalStudents: 0, totalEnrollments: 0, courseMap: {} },
                message: "No students found",
            };
        }
        const enrollments = await enrollment_model_1.default.aggregate([
            { $match: { course: { $in: courseIds }, paymentStatus: { $in: ["paid", "free"] } } },
            {
                $lookup: {
                    from: "users",
                    localField: "student",
                    foreignField: "_id",
                    as: "studentData",
                    pipeline: [{ $project: { name: 1, email: 1, avatar: 1, createdAt: 1 } }],
                },
            },
            { $unwind: "$studentData" },
            {
                $lookup: {
                    from: "courses",
                    localField: "course",
                    foreignField: "_id",
                    as: "courseData",
                    pipeline: [{ $project: { title: 1 } }],
                },
            },
            { $unwind: "$courseData" },
            {
                $lookup: {
                    from: "courseprogresses",
                    let: { studentId: "$student", courseId: "$course" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$user", "$$studentId"] }, { $eq: ["$course", "$$courseId"] }],
                                },
                            },
                        },
                        { $project: { completionPercentage: 1, isCourseCompleted: 1 } },
                    ],
                    as: "progressData",
                },
            },
            {
                $project: {
                    studentId: "$student",
                    studentName: "$studentData.name",
                    studentEmail: "$studentData.email",
                    studentAvatar: "$studentData.avatar",
                    studentJoinedAt: "$studentData.createdAt",
                    courseId: "$course",
                    courseTitle: "$courseData.title",
                    enrolledAt: "$enrollmentDate",
                    amountPaid: 1,
                    paymentStatus: 1,
                    validUntil: 1,
                    progress: { $arrayElemAt: ["$progressData", 0] },
                },
            },
            { $sort: { enrolledAt: -1 } },
        ]);
        const studentsMap = new Map();
        enrollments.forEach((enrollment) => {
            const studentId = enrollment.studentId.toString();
            if (!studentsMap.has(studentId)) {
                studentsMap.set(studentId, {
                    _id: enrollment.studentId,
                    name: enrollment.studentName,
                    email: enrollment.studentEmail,
                    avatar: enrollment.studentAvatar,
                    joinedAt: enrollment.studentJoinedAt,
                    courses: [],
                    totalEnrolled: 0,
                    totalCompleted: 0,
                    totalRevenue: 0,
                });
            }
            const student = studentsMap.get(studentId);
            student.courses.push({
                courseId: enrollment.courseId,
                courseTitle: enrollment.courseTitle,
                enrolledAt: enrollment.enrolledAt,
                amountPaid: enrollment.amountPaid,
                paymentStatus: enrollment.paymentStatus,
                validUntil: enrollment.validUntil || null,
                completionPercentage: enrollment.progress?.completionPercentage || 0,
                isCompleted: enrollment.progress?.isCourseCompleted || false,
            });
            student.totalEnrolled += 1;
            student.totalCompleted += enrollment.progress?.isCourseCompleted ? 1 : 0;
            student.totalRevenue += enrollment.amountPaid || 0;
        });
        const students = Array.from(studentsMap.values());
        const courseMap = {};
        instructorCourses.forEach((c) => {
            courseMap[c._id.toString()] = c.title;
        });
        return {
            success: true,
            data: { students, totalStudents: students.length, totalEnrollments: enrollments.length, courseMap },
            message: "Students retrieved successfully",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve students", errors: [error.message] };
    }
};
exports.getStudentsByInstructor = getStudentsByInstructor;
// ─────────────────────────────────────────────
// SUBMIT TOOL PAYMENT
// ─────────────────────────────────────────────
const submitToolPayment = async ({ studentId, toolId, transactionId, variationDays, }) => {
    try {
        const existing = await enrollment_model_1.default.findOne({
            student: new mongoose_1.Types.ObjectId(studentId),
            tool: new mongoose_1.Types.ObjectId(toolId),
            paymentStatus: { $in: ["paid", "free", "pending"] },
        });
        if (existing)
            return { success: false, message: "You already have access to this tool.", errors: [] };
        const tool = await tool_model_1.default.findById(toolId).lean();
        if (!tool)
            return { success: false, message: "Tool not found.", errors: [] };
        let finalPrice = tool.price;
        if (tool.discount > 0)
            finalPrice = finalPrice - (finalPrice * tool.discount) / 100;
        if (variationDays && tool.variations?.length > 0) {
            const variation = tool.variations.find((v) => v.days === variationDays);
            if (variation)
                finalPrice = variation.price;
        }
        finalPrice = Math.round(finalPrice * 100) / 100;
        if (finalPrice <= 0) {
            const enrollment = await enrollment_model_1.default.create({
                student: studentId,
                tool: toolId,
                itemType: "tool",
                amountPaid: 0,
                paymentStatus: "free",
                paymentMethod: "free",
                validUntil: variationDays ? new Date(Date.now() + variationDays * 86_400_000) : null,
            });
            return { success: true, data: enrollment, message: "Tool access granted." };
        }
        const enrollment = await enrollment_model_1.default.create({
            student: studentId,
            tool: toolId,
            itemType: "tool",
            amountPaid: finalPrice,
            paymentStatus: "pending",
            paymentMethod: "bkash",
            transactionId: transactionId.trim(),
        });
        return {
            success: true,
            data: enrollment,
            message: "Payment submitted. Access will be activated within 10–15 minutes.",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to submit tool payment.", errors: [error.message] };
    }
};
exports.submitToolPayment = submitToolPayment;
// ─────────────────────────────────────────────
// CHECK TOOL ENROLLMENT STATUS
// ─────────────────────────────────────────────
const checkToolEnrollmentStatus = async (toolId, userId) => {
    try {
        const enrollment = await enrollment_model_1.default.findOne({
            student: new mongoose_1.Types.ObjectId(userId),
            tool: new mongoose_1.Types.ObjectId(toolId),
        })
            .select("paymentStatus paymentMethod transactionId validUntil")
            .lean();
        const isExpired = enrollment?.paymentStatus === "paid" &&
            enrollment.validUntil &&
            new Date() > new Date(enrollment.validUntil);
        return {
            success: true,
            data: {
                isEnrolled: !!enrollment && !isExpired,
                paymentStatus: isExpired ? "expired" : (enrollment?.paymentStatus || null),
                paymentMethod: enrollment?.paymentMethod || null,
                validUntil: enrollment?.validUntil || null,
            },
            message: "Tool enrollment status checked successfully",
        };
    }
    catch (error) {
        return { success: false, message: "Failed to check tool enrollment status", errors: [error.message] };
    }
};
exports.checkToolEnrollmentStatus = checkToolEnrollmentStatus;
// ─────────────────────────────────────────────
// GET USER TOOLS
// ─────────────────────────────────────────────
const getUserTools = async (userId) => {
    try {
        const enrollments = await enrollment_model_1.default.find({
            student: new mongoose_1.Types.ObjectId(userId),
            itemType: "tool",
        })
            .populate({
            path: "tool",
            select: "name thumbnail accessLink price isPackage",
        })
            .sort({ createdAt: -1 })
            .lean();
        const now = new Date();
        const tools = enrollments
            .filter((e) => {
            // sourcePackage থেকে আসা individual tools বাদ দাও pending এ
            // package নিজে শুধু pending/rejected এ দেখাবে, paid হলে সরে যাবে
            if (e.tool?.isPackage === true && e.paymentStatus === "paid")
                return false;
            // sourcePackage থেকে আসা tools শুধু paid/free হলেই দেখাবে
            if (e.sourcePackage && e.paymentStatus !== "paid" && e.paymentStatus !== "free")
                return false;
            return true;
        })
            .map((e) => {
            const isExpired = e.paymentStatus === "paid" &&
                e.validUntil &&
                now > new Date(e.validUntil);
            return {
                ...e,
                paymentStatus: isExpired ? "expired" : e.paymentStatus,
            };
        });
        return { success: true, data: tools, message: "User tools retrieved" };
    }
    catch (error) {
        return { success: false, message: "Failed to retrieve user tools", errors: [error.message] };
    }
};
exports.getUserTools = getUserTools;
//# sourceMappingURL=enrollment.service.js.map