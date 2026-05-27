export declare const permissions: {
    course: {
        create: string;
        read: string;
        update: string;
        delete: string;
        analytics: string;
        stats: string;
    };
    user: {
        read: string;
        readAll: string;
        update: string;
        delete: string;
        updateSelf: string;
        resetPasswordSelf: string;
        updateRole: string;
    };
    coupon: {
        create: string;
        read: string;
        update: string;
        delete: string;
    };
    chapter: {
        create: string;
        read: string;
        update: string;
        delete: string;
    };
    lecture: {
        create: string;
        read: string;
        update: string;
        delete: string;
    };
    quiz: {
        create: string;
        read: string;
        update: string;
        delete: string;
        submit: string;
        readAnswers: string;
        viewResults: string;
    };
    progress: {
        read: string;
        update: string;
        viewDashboard: string;
    };
    review: {
        create: string;
        read: string;
        update: string;
        delete: string;
    };
    discussion: {
        create: string;
        read: string;
        update: string;
        delete: string;
        answer: string;
    };
    notification: {
        create: string;
        read: string;
        update: string;
        delete: string;
        sendBulk: string;
    };
    certificate: {
        read: string;
        verify: string;
        stats: string;
    };
};
export declare const rolePermissions: {
    user: string[];
    instructor: string[];
    admin: string[];
};
//# sourceMappingURL=rbac.d.ts.map