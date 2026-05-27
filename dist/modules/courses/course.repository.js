"use strict";
// src/modules/courses/course.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourseById = exports.deleteCourseDependencies = exports.updateCourse = exports.createCourse = exports.aggregateCourseDetails = exports.aggregateCourseDetailsWithEnrollment = exports.findCourseById = exports.findCourses = exports.countCourses = void 0;
const mongoose_1 = require("mongoose");
const course_model_1 = __importDefault(require("./course.model"));
const lecture_model_1 = __importDefault(require("../lectures/lecture.model"));
const chapter_model_1 = __importDefault(require("../chapters/chapter.model"));
const review_model_1 = __importDefault(require("../reviews/review.model"));
const progress_model_1 = __importDefault(require("../progress/progress.model"));
const enrollment_model_1 = __importDefault(require("../enrollments/enrollment.model"));
// --- Repository Functions ---
const countCourses = (query) => {
    return course_model_1.default.countDocuments(query);
};
exports.countCourses = countCourses;
const findCourses = async (query, options) => {
    const skip = (options.page - 1) * options.limit;
    const courses = await course_model_1.default.find(query)
        .select('title description price discount thumbnail category level status createdAt updatedAt instructor reviewCount enrollmentCount totalDuration averageRating')
        .populate({
        path: 'instructor',
        select: 'name avatar role',
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .lean();
    return courses;
};
exports.findCourses = findCourses;
const findCourseById = (courseId, session) => {
    return course_model_1.default.findById(courseId).session(session || null);
};
exports.findCourseById = findCourseById;
// Advanced aggregation pipeline with enrollment-aware content
const aggregateCourseDetailsWithEnrollment = (courseId) => {
    const pipeline = [
        { $match: { _id: new mongoose_1.Types.ObjectId(courseId) } },
        // Lookup instructor details
        {
            $lookup: {
                from: "users",
                localField: "instructor",
                foreignField: "_id",
                as: "instructorDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            avatar: 1,
                            role: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                instructor: { $arrayElemAt: ["$instructorDetails", 0] }
            }
        },
        {
            $project: {
                instructorDetails: 0
            }
        },
        // Lookup chapters with their content
        {
            $lookup: {
                from: "chapters",
                localField: "_id",
                foreignField: "course",
                as: "chapters",
                pipeline: [
                    { $sort: { order: 1 } },
                    // Lookup lectures
                    {
                        $lookup: {
                            from: "lectures",
                            localField: "_id",
                            foreignField: "chapter",
                            as: "lectures",
                            pipeline: [{ $sort: { order: 1 } }],
                        },
                    },
                    // Lookup quizzes with their questions
                    {
                        $lookup: {
                            from: "quizzes",
                            localField: "_id",
                            foreignField: "chapter",
                            as: "quizzes",
                            pipeline: [
                                { $sort: { order: 1 } },
                                // Lookup questions for each quiz
                                {
                                    $lookup: {
                                        from: "questions",
                                        localField: "_id",
                                        foreignField: "quiz",
                                        as: "questions",
                                        pipeline: [{ $sort: { order: 1 } }],
                                    },
                                },
                            ],
                        },
                    },
                    // Merge into items array with proper ordering and resource logic
                    {
                        $addFields: {
                            items: {
                                $let: {
                                    vars: {
                                        lectureItems: {
                                            $map: {
                                                input: "$lectures",
                                                as: "lec",
                                                in: {
                                                    $mergeObjects: [
                                                        {
                                                            type: "lecture",
                                                            lectureId: "$$lec._id",
                                                            title: "$$lec.title",
                                                            isPreview: "$$lec.isPreview",
                                                            order: "$$lec.order",
                                                            // Only show video URL if preview is true
                                                            videoUrl: {
                                                                $cond: ["$$lec.isPreview", "$$lec.videoUrl", ""],
                                                            },
                                                            duration: "$$lec.duration",
                                                        },
                                                        // Conditionally add resources field based on isPreview and resources existence
                                                        {
                                                            $let: {
                                                                vars: {
                                                                    hasActualResources: {
                                                                        $and: [
                                                                            { $ne: ["$$lec.resources", null] },
                                                                            { $ne: ["$$lec.resources", undefined] },
                                                                            { $ne: ["$$lec.resources", ""] },
                                                                            { $gt: [{ $strLenCP: { $ifNull: ["$$lec.resources", ""] } }, 0] }
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $cond: [
                                                                        // Case 1: isPreview = true AND has actual resources -> include actual resources
                                                                        {
                                                                            $and: ["$$lec.isPreview", "$$hasActualResources"]
                                                                        },
                                                                        { resources: "$$lec.resources" },
                                                                        {
                                                                            $cond: [
                                                                                // Case 2: isPreview = false AND has actual resources -> include empty resources
                                                                                {
                                                                                    $and: [
                                                                                        { $eq: ["$$lec.isPreview", false] },
                                                                                        "$$hasActualResources"
                                                                                    ]
                                                                                },
                                                                                { resources: "" },
                                                                                // Case 3: No actual resources -> don't include resources field
                                                                                {}
                                                                            ]
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    ]
                                                },
                                            },
                                        },
                                        quizItems: {
                                            $map: {
                                                input: "$quizzes",
                                                as: "quiz",
                                                in: {
                                                    type: "quiz",
                                                    quizId: "$$quiz._id",
                                                    title: "$$quiz.title",
                                                    order: "$$quiz.order",
                                                    questionCount: { $size: "$$quiz.questions" },
                                                    questions: {
                                                        $map: {
                                                            input: "$$quiz.questions",
                                                            as: "question",
                                                            in: {
                                                                questionId: "$$question._id",
                                                                text: "$$question.text",
                                                                order: "$$question.order",
                                                                type: "$$question.type",
                                                                options: "$$question.options",
                                                                // Hide correct answer for public route
                                                                correctOptionId: { $ifNull: ["$$question.correctOptionId", null] }
                                                            }
                                                        }
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    in: {
                                        // Concatenate and sort by order
                                        $sortArray: {
                                            input: { $concatArrays: ["$$lectureItems", "$$quizItems"] },
                                            sortBy: { order: 1 }
                                        }
                                    }
                                }
                            },
                        },
                    },
                    // Calculate chapter duration from lectures
                    {
                        $addFields: {
                            chapterDuration: {
                                $sum: {
                                    $map: {
                                        input: "$lectures",
                                        as: "lec",
                                        in: "$$lec.duration"
                                    }
                                }
                            }
                        }
                    },
                    { $project: { lectures: 0, quizzes: 0, content: 0 } },
                ],
            },
        },
        // Lookup total enrollments
        {
            $lookup: {
                from: "enrollments",
                localField: "_id",
                foreignField: "course",
                as: "enrollments",
            },
        },
        // Lookup reviews
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "course",
                as: "reviews",
            },
        },
        {
            $addFields: {
                enrollmentCount: { $size: "$enrollments" },
                reviewCount: { $size: "$reviews" },
                averageRating: { $avg: "$reviews.rating" },
                totalDuration: {
                    $sum: {
                        $map: {
                            input: "$chapters",
                            as: "chapter",
                            in: "$$chapter.chapterDuration"
                        }
                    }
                },
            },
        },
        {
            $project: {
                enrollments: 0,
                reviews: 0,
            },
        },
    ];
    return course_model_1.default.aggregate(pipeline);
};
exports.aggregateCourseDetailsWithEnrollment = aggregateCourseDetailsWithEnrollment;
// Legacy function for backward compatibility
const aggregateCourseDetails = (courseId) => {
    return (0, exports.aggregateCourseDetailsWithEnrollment)(courseId);
};
exports.aggregateCourseDetails = aggregateCourseDetails;
// --- WRITE/MUTATION Operations ---
const createCourse = (data, session) => {
    return course_model_1.default.create([data], { session }).then(res => {
        if (res.length === 0) {
            // Throw an error if the repository fails to create the single document
            throw new Error("Repository failed to create course document.");
        }
        // FINAL FIX: We use the non-null assertion (!) because the 'if' block guarantees 
        // that the array is not empty and the element exists.
        return res[0];
    });
};
exports.createCourse = createCourse;
const updateCourse = (courseId, updateData, session) => {
    return course_model_1.default.findByIdAndUpdate(courseId, updateData, { new: true, runValidators: true }).session(session || null);
};
exports.updateCourse = updateCourse;
// --- CASCADING DELETE Operations ---
const deleteCourseDependencies = async (courseId, chapterIds, session) => {
    // NOTE: This must use the new polymorphic structure for deletion
    // Use Promise.all for parallel deletion operations (much faster!)
    await Promise.all([
        lecture_model_1.default.deleteMany({ chapter: { $in: chapterIds } }).session(session),
        chapter_model_1.default.deleteMany({ _id: { $in: chapterIds } }).session(session),
        review_model_1.default.deleteMany({ course: courseId }).session(session),
        progress_model_1.default.deleteMany({ course: courseId }).session(session),
        enrollment_model_1.default.deleteMany({ course: courseId }).session(session)
    ]);
};
exports.deleteCourseDependencies = deleteCourseDependencies;
const deleteCourseById = (courseId, session) => {
    return course_model_1.default.findByIdAndDelete(courseId).session(session);
};
exports.deleteCourseById = deleteCourseById;
//# sourceMappingURL=course.repository.js.map