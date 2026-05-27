import { z } from 'zod';
export declare const createQuizSchema: z.ZodObject<{
    body: z.ZodObject<{
        course: z.ZodString;
        chapter: z.ZodString;
        title: z.ZodString;
        questions: z.ZodArray<z.ZodObject<{
            questionText: z.ZodString;
            options: z.ZodArray<z.ZodString>;
            correctAnswer: z.ZodNumber;
            explanation: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        order: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateQuizSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodNumber>;
        questions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            questionText: z.ZodString;
            options: z.ZodArray<z.ZodString>;
            correctAnswer: z.ZodNumber;
            explanation: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const quizIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const submitQuizAttemptSchema: z.ZodObject<{
    body: z.ZodObject<{
        answers: z.ZodArray<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getQuizResultsSchema: z.ZodObject<{
    params: z.ZodObject<{
        courseId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ICreateQuizBody = z.infer<typeof createQuizSchema>['body'];
export type IUpdateQuizBody = z.infer<typeof updateQuizSchema>['body'];
export type ISubmitQuizAttemptBody = z.infer<typeof submitQuizAttemptSchema>['body'];
//# sourceMappingURL=quiz.validation.d.ts.map