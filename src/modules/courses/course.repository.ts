
// src/modules/courses/course.repository.ts

import mongoose, { Types, ClientSession } from 'mongoose';
import Course, { ICourse } from './course.model';
import Lecture from '../lectures/lecture.model';
import Chapter from '../chapters/chapter.model';
import ReviewModel from '../reviews/review.model';
import CourseProgress from '../progress/progress.model';
import Enrollment from '../enrollments/enrollment.model';


// --- Types ---
type CourseQueryOptions = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  level?: string;
};

// --- Repository Functions ---

export const countCourses = (query: any): Promise<number> => {
  return Course.countDocuments(query);
};

export const findCourses = async (
  query: any,
  options: CourseQueryOptions
): Promise<ICourse[]> => {
  const skip = (options.page - 1) * options.limit;

  const courses = await Course.find(query)
    .select(
      'title description price discount thumbnail category level status createdAt updatedAt instructor reviewCount enrollmentCount totalDuration averageRating'
    )
    .populate({
      path: 'instructor',
      select: 'name avatar role',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(options.limit)
    .lean();

  return courses as unknown as ICourse[];
};

export const findCourseById = (courseId: string, session?: ClientSession): Promise<ICourse | null> => {
  return Course.findById(courseId).session(session || null);
};

// Advanced aggregation pipeline with enrollment-aware content
export const aggregateCourseDetailsWithEnrollment = (
  courseId: string,
): Promise<any> => {
  const pipeline: any[] = [
    { $match: { _id: new Types.ObjectId(courseId) } },

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

  return Course.aggregate(pipeline);
};


// Legacy function for backward compatibility
export const aggregateCourseDetails = (courseId: string): Promise<any> => {
  return aggregateCourseDetailsWithEnrollment(courseId);
};

// --- WRITE/MUTATION Operations ---

export const createCourse = (data: any, session?: ClientSession): Promise<ICourse> => {
  return Course.create([data], { session }).then(res => {
    if (res.length === 0) {
      // Throw an error if the repository fails to create the single document
      throw new Error("Repository failed to create course document."); 
    }
    
    // FINAL FIX: We use the non-null assertion (!) because the 'if' block guarantees 
    // that the array is not empty and the element exists.
    return res[0]!; 
  });
};

export const updateCourse = (courseId: string, updateData: any, session?: ClientSession): Promise<ICourse | null> => {
  return Course.findByIdAndUpdate(courseId, updateData, { new: true, runValidators: true }).session(session || null);
};


// --- CASCADING DELETE Operations ---

export const deleteCourseDependencies = async (courseId: string, chapterIds: Types.ObjectId[], session: ClientSession): Promise<void> => {
  // NOTE: This must use the new polymorphic structure for deletion
  // Use Promise.all for parallel deletion operations (much faster!)
  await Promise.all([
    Lecture.deleteMany({ chapter: { $in: chapterIds } }).session(session),
    Chapter.deleteMany({ _id: { $in: chapterIds } }).session(session),
    ReviewModel.deleteMany({ course: courseId }).session(session),
    CourseProgress.deleteMany({ course: courseId }).session(session),
    Enrollment.deleteMany({ course: courseId }).session(session)
  ]);
};

export const deleteCourseById = (courseId: string, session: ClientSession): Promise<ICourse | null> => {
  return Course.findByIdAndDelete(courseId).session(session);
};