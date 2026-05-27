"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.getEmailStatus = exports.sendBulkEmails = exports.sendEmailWithRetry = exports.verifyEmailConnection = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// --- CONFIGURATION ---
const getEmailConfig = () => {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secureEnv = process.env.SMTP_SECURE;
    const secure = typeof secureEnv === 'string'
        ? secureEnv === 'true' || secureEnv === '1'
        : port === 465; // Implicitly use TLS for port 465
    return {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure,
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
        from: process.env.SMTP_FROM || 'noreply@codetutor.com',
    };
};
const getRetryConfig = () => ({
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    backoffMultiplier: 2,
});
// --- CORE FUNCTIONS ---
/**
 * Create email transporter
 */
const createTransporter = () => {
    const config = getEmailConfig();
    return nodemailer_1.default.createTransport(config);
};
/**
 * Verify email configuration
 */
const verifyEmailConnection = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email service connection verified');
        return true;
    }
    catch (error) {
        console.error('❌ Email service connection failed:', error);
        return false;
    }
};
exports.verifyEmailConnection = verifyEmailConnection;
/**
 * Check if template exists
 */
const resolveTemplatePath = (templateName) => {
    const candidates = [
        path_1.default.join(__dirname, `../templates/${templateName}.ejs`), // ts-node / src runtime
        path_1.default.resolve(__dirname, `../../src/templates/${templateName}.ejs`), // compiled dist runtime pointing back to src
        path_1.default.join(process.cwd(), `src/templates/${templateName}.ejs`), // cwd fallback (dev)
        path_1.default.join(process.cwd(), `dist/templates/${templateName}.ejs`), // cwd fallback (prod)
    ];
    for (const candidate of candidates) {
        if (fs_1.default.existsSync(candidate))
            return candidate;
    }
    // default to first for error context, but ensure a non-undefined string
    const defaultPath = path_1.default.join(__dirname, `../templates/${templateName}.ejs`);
    return candidates[0] || defaultPath;
};
const checkTemplateExists = (templateName) => {
    const templatePath = resolveTemplatePath(templateName);
    return fs_1.default.existsSync(templatePath);
};
/**
 * Render email template
 */
const renderTemplate = async (templateName, data) => {
    const templatePath = resolveTemplatePath(templateName);
    return await ejs_1.default.renderFile(templatePath, data);
};
/**
 * Prepare email options
 */
const prepareEmailOptions = (to, subject, html, templateName, priority, tags) => {
    const config = getEmailConfig();
    return {
        from: config.from,
        to,
        subject,
        html,
        priority,
        headers: {
            'X-Priority': priority === 'high' ? '1' : priority === 'low' ? '5' : '3',
            'X-Mailer': 'CodeTutor LMS',
            'X-Template': templateName,
            ...(tags.length > 0 && { 'X-Tags': tags.join(',') }),
        },
    };
};
/**
 * Calculate retry delay with exponential backoff
 */
const calculateRetryDelay = (attempt) => {
    const retryConfig = getRetryConfig();
    return retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
};
/**
 * Send single email with retry logic
 */
const sendEmailWithRetry = async (to, subject, templateName, data, options = {}) => {
    const retryConfig = getRetryConfig();
    const { retries = retryConfig.maxRetries, priority = 'normal', tags = [] } = options;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Check if template exists
            if (!checkTemplateExists(templateName)) {
                throw new Error(`Email template not found: ${templateName}.ejs`);
            }
            // Render the EJS template with the provided data
            const html = await renderTemplate(templateName, data);
            // Prepare email options
            const mailOptions = prepareEmailOptions(to, subject, html, templateName, priority, tags);
            // Send the email
            const transporter = createTransporter();
            const result = await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${to} (attempt ${attempt}/${retries})`);
            console.log(`📧 Subject: ${subject}`);
            console.log(`📧 Message ID: ${result.messageId}`);
            return {
                success: true,
                messageId: result.messageId,
            };
        }
        catch (error) {
            console.error(`❌ Email send attempt ${attempt}/${retries} failed:`, error.message);
            if (attempt === retries) {
                // Final attempt failed
                console.error(`💥 All email attempts failed for ${to}`);
                return {
                    success: false,
                    error: error.message,
                };
            }
            // Wait before retry with exponential backoff
            const delay = calculateRetryDelay(attempt);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return {
        success: false,
        error: 'Max retries exceeded',
    };
};
exports.sendEmailWithRetry = sendEmailWithRetry;
/**
 * Send bulk emails with rate limiting
 */
const sendBulkEmails = async (emails, options = {}) => {
    const { batchSize = 10, delayBetweenBatches = 1000, priority = 'normal' } = options;
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    console.log(`📧 Starting bulk email send: ${emails.length} emails in batches of ${batchSize}`);
    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)}`);
        // Process batch in parallel
        const batchPromises = batch.map(async (email) => {
            const result = await (0, exports.sendEmailWithRetry)(email.to, email.subject, email.templateName, email.data, { priority });
            return {
                to: email.to,
                success: result.success,
                error: result.error,
            };
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        // Count results
        batchResults.forEach(result => {
            if (result.success) {
                successCount++;
            }
            else {
                failedCount++;
            }
        });
        // Delay between batches to avoid rate limiting
        if (i + batchSize < emails.length) {
            console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
    }
    console.log(`📊 Bulk email completed: ${successCount} successful, ${failedCount} failed`);
    return {
        success: successCount,
        failed: failedCount,
        results,
    };
};
exports.sendBulkEmails = sendBulkEmails;
/**
 * Get email service status
 */
const getEmailStatus = () => {
    return {
        config: getEmailConfig(),
        retryConfig: getRetryConfig(),
    };
};
exports.getEmailStatus = getEmailStatus;
// --- BACKWARD COMPATIBILITY ---
/**
 * Send email (backward compatibility function)
 */
const sendEmail = async (to, subject, templateName, data) => {
    const result = await (0, exports.sendEmailWithRetry)(to, subject, templateName, data);
    if (!result.success) {
        throw new Error(`Failed to send email: ${result.error}`);
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=email.js.map