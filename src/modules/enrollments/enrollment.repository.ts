// src/modules/enrollments/enrollment.repository.ts

import mongoose, { Types, ClientSession } from 'mongoose';
import Enrollment, { IEnrollment } from './enrollment.model';


// --- READ Operations ---

export const findEnrollmentById = (enrollmentId: string, session?: ClientSession): Promise<any> => {
  return Enrollment.findById(enrollmentId)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findEnrollmentByStudentAndCourse = (
  studentId: string, 
  courseId: string, 
  session?: ClientSession
): Promise<any> => {
  return Enrollment.findOne({ student: studentId, course: courseId })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findEnrollmentsByStudent = (studentId: string, session?: ClientSession): Promise<any[]> => {
  return Enrollment.find({ student: studentId })
    .populate('course', 'title thumbnail category level averageRating price instructor')
    .sort({ enrollmentDate: -1 }) // Use enrollmentDate instead of enrolledAt
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findEnrollmentsByCourse = (courseId: string, session?: ClientSession): Promise<any[]> => {
  return Enrollment.find({ course: courseId })
    .populate('student', 'name email avatar')
    .sort({ enrollmentDate: -1 }) // Use enrollmentDate instead of enrolledAt
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

// --- WRITE Operations (Only what's needed for the specified routes) ---

export const createEnrollment = (data: Partial<IEnrollment>, session?: ClientSession): Promise<IEnrollment> => {
  return Enrollment.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create enrollment document.");
    }
    return res[0]!;
  });
};

// Optimized: Get enrollment statistics for multiple courses
export const getEnrollmentStats = (courseIds: string[]): Promise<any[]> => {
  return Enrollment.aggregate([
    { $match: { course: { $in: courseIds.map(id => new Types.ObjectId(id)) } } },
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

// Optimized: Check multiple enrollments at once
export const checkMultipleEnrollments = (studentId: string, courseIds: string[]): Promise<any[]> => {
  return Enrollment.find({
    student: new Types.ObjectId(studentId),
    course: { $in: courseIds.map(id => new Types.ObjectId(id)) }
  }).select('course').lean();
};