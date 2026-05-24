// src/modules/certificates/certificate.repository.ts

import { Types, ClientSession } from 'mongoose';
import Certificate, { ICertificate } from './certificate.model';


// --- READ Operations ---

export const findCertificateById = (
  certificateId: string, 
  session?: ClientSession
): Promise<any> => {
  return Certificate.findOne({ certificateId })
    .populate('course', 'title instructor')
    .populate('user', 'name email')
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findCertificateByUserAndCourse = (
  userId: string, 
  courseId: string, 
  session?: ClientSession
): Promise<any> => {
  return Certificate.findOne({ user: userId, course: courseId })
    .populate('course', 'title instructor')
    .populate('user', 'name email')
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findCertificatesByUser = (
  userId: string, 
  options: any = {},
  session?: ClientSession
): Promise<any[]> => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return Certificate.find({ user: userId })
    .populate('course', 'title thumbnail instructor')
    .sort({ issueDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};




// --- WRITE Operations ---

export const createCertificate = (
  data: Partial<ICertificate>, 
  session?: ClientSession
): Promise<ICertificate> => {
  return Certificate.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create certificate document.");
    }
    return res[0]!;
  });
};


export const deleteCertificateById = (
  certificateId: string, 
  session?: ClientSession
): Promise<any> => {
  return Certificate.findOneAndDelete({ certificateId })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};



// --- AGGREGATION Operations ---


