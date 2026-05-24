import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { globalErrorHandler } from './middlewares/globalError';

import userRoutes from './modules/users/user.routes';
import coursesRoutes from './modules/courses/course.routes';
import enrollmentRoutes from './modules/enrollments/enrollment.routes';
import couponRoutes from './modules/coupons/coupon.routes';
import chaptersRoutes from "./modules/chapters/chapter.routes";
import lecturesRoutes from "./modules/lectures/lecture.routes";
import quizRoutes from "./modules/quizes/quiz.routes";
import progressRoutes from "./modules/progress/progress.routes";
import discussionRoutes from "./modules/discussions/discussion.routes";
import reviewRoutes from "./modules/reviews/review.routes";
import certificateRoutes from './modules/certificates/certificate.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import toolRoutes from './modules/tools/tool.routes';

const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARES FIRST
// ─────────────────────────────────────────────

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL!
    ],
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],
  })
);

// IMPORTANT
// body parser BEFORE routes
app.use(express.json({ limit: '50mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb'
  })
);

app.use(cookieParser());

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────



app.use("/api/v1/tools", toolRoutes);

app.use("/api/v1/user", userRoutes);

app.use("/api/v1/courses", coursesRoutes);

app.use("/api/v1/enrollment", enrollmentRoutes);

app.use("/api/v1/coupon", couponRoutes);

app.use("/api/v1/chapters", chaptersRoutes);

app.use("/api/v1/lectures", lecturesRoutes);

app.use("/api/v1/quizes", quizRoutes);

app.use("/api/v1/progress", progressRoutes);

app.use("/api/v1/discussions", discussionRoutes);

app.use("/api/v1/reviews", reviewRoutes);

app.use("/api/v1/certificates", certificateRoutes);

app.use("/api/v1/notifications", notificationRoutes);

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────

app.get("/", (_req: Request, res: Response) => {
  res.send("LMS Backend Server is Running...");
});

// ─────────────────────────────────────────────
// ERROR HANDLER LAST
// ─────────────────────────────────────────────

app.use(globalErrorHandler);

export default app;