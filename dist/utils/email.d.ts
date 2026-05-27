interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}
interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
}
interface EmailOptions {
    retries?: number;
    priority?: 'high' | 'normal' | 'low';
    tags?: string[];
}
interface BulkEmailOptions {
    batchSize?: number;
    delayBetweenBatches?: number;
    priority?: 'high' | 'normal' | 'low';
}
interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
interface BulkEmailResult {
    success: number;
    failed: number;
    results: Array<{
        to: string;
        success: boolean;
        error?: string;
    }>;
}
interface EmailData {
    to: string;
    subject: string;
    templateName: string;
    data: object;
}
/**
 * Verify email configuration
 */
export declare const verifyEmailConnection: () => Promise<boolean>;
/**
 * Send single email with retry logic
 */
export declare const sendEmailWithRetry: (to: string, subject: string, templateName: string, data: object, options?: EmailOptions) => Promise<EmailResult>;
/**
 * Send bulk emails with rate limiting
 */
export declare const sendBulkEmails: (emails: EmailData[], options?: BulkEmailOptions) => Promise<BulkEmailResult>;
/**
 * Get email service status
 */
export declare const getEmailStatus: () => {
    config: EmailConfig;
    retryConfig: RetryConfig;
};
/**
 * Send email (backward compatibility function)
 */
export declare const sendEmail: (to: string, subject: string, templateName: string, data: object) => Promise<void>;
export {};
//# sourceMappingURL=email.d.ts.map