"use strict";
// src/modules/discussions/discussion.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDiscussionById = exports.createDiscussion = exports.findDiscussionsByUser = exports.findDiscussionsByCourse = exports.findDiscussionsByLecture = exports.findDiscussionById = void 0;
const discussion_model_1 = __importDefault(require("./discussion.model"));
// --- READ Operations ---
const findDiscussionById = (discussionId, session) => {
    return discussion_model_1.default.findById(discussionId)
        .populate('user', 'name avatar')
        .populate('lecture', 'title order')
        .populate('answers.user', 'name avatar')
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findDiscussionById = findDiscussionById;
const findDiscussionsByLecture = (lectureId, options = {}, session) => {
    const { page = 1, limit = 20, hasAnswers } = options;
    const skip = (page - 1) * limit;
    const query = { lecture: lectureId };
    if (hasAnswers !== undefined) {
        query['answers.0'] = hasAnswers ? { $exists: true } : { $exists: false };
    }
    return discussion_model_1.default.find(query)
        .populate('user', 'name avatar')
        .populate('answers.user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findDiscussionsByLecture = findDiscussionsByLecture;
const findDiscussionsByCourse = (courseId, options = {}, session) => {
    const { page = 1, limit = 50, hasAnswers } = options;
    const skip = (page - 1) * limit;
    const query = { course: courseId };
    if (hasAnswers !== undefined) {
        query['answers.0'] = hasAnswers ? { $exists: true } : { $exists: false };
    }
    return discussion_model_1.default.find(query)
        .populate('user', 'name avatar')
        .populate('lecture', 'title order')
        .populate('answers.user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findDiscussionsByCourse = findDiscussionsByCourse;
const findDiscussionsByUser = (userId, options = {}, session) => {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    return discussion_model_1.default.find({ user: userId })
        .populate('lecture', 'title order')
        .populate('course', 'title thumbnail')
        .populate('answers.user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findDiscussionsByUser = findDiscussionsByUser;
// --- WRITE Operations ---
const createDiscussion = (data, session) => {
    return discussion_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create discussion document.");
        }
        return res[0];
    });
};
exports.createDiscussion = createDiscussion;
const deleteDiscussionById = (discussionId, session) => {
    return discussion_model_1.default.findByIdAndDelete(discussionId).session(session || null);
};
exports.deleteDiscussionById = deleteDiscussionById;
// --- AGGREGATION Operations ---
//# sourceMappingURL=discussion.repository.js.map