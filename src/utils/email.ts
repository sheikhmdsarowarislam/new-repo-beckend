import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import fs from "fs";

// Email configuration interface
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

// Email retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

// Email options interface
interface EmailOptions {
  retries?: number;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
}

// Bulk email options interface
interface BulkEmailOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  priority?: 'high' | 'normal' | 'low';
}

// Email result interface
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Bulk email result interface
interface BulkEmailResult {
  success: number;
  failed: number;
  results: Array<{ to: string; success: boolean; error?: string }>;
}

// Email data interface
interface EmailData {
  to: string;
  subject: string;
  templateName: string;
  data: object;
}

// --- CONFIGURATION ---

const getEmailConfig = (): EmailConfig => {
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

const getRetryConfig = (): RetryConfig => ({
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
});

// --- CORE FUNCTIONS ---

/**
 * Create email transporter
 */
const createTransporter = (): nodemailer.Transporter => {
  const config = getEmailConfig();
  return nodemailer.createTransport(config);
};

/**
 * Verify email configuration
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error);
    return false;
  }
};

/**
 * Check if template exists
 */
const resolveTemplatePath = (templateName: string): string => {
  const candidates = [
    path.join(__dirname, `../templates/${templateName}.ejs`), // ts-node / src runtime
    path.resolve(__dirname, `../../src/templates/${templateName}.ejs`), // compiled dist runtime pointing back to src
    path.join(process.cwd(), `src/templates/${templateName}.ejs`), // cwd fallback (dev)
    path.join(process.cwd(), `dist/templates/${templateName}.ejs`), // cwd fallback (prod)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // default to first for error context, but ensure a non-undefined string
  const defaultPath = path.join(__dirname, `../templates/${templateName}.ejs`);
  return candidates[0] || defaultPath;
};

const checkTemplateExists = (templateName: string): boolean => {
  const templatePath = resolveTemplatePath(templateName);
  return fs.existsSync(templatePath);
};

/**
 * Render email template
 */
const renderTemplate = async (templateName: string, data: object): Promise<string> => {
  const templatePath = resolveTemplatePath(templateName);
  return await ejs.renderFile(templatePath, data);
};

/**
 * Prepare email options
 */
const prepareEmailOptions = (
  to: string,
  subject: string,
  html: string,
  templateName: string,
  priority: 'high' | 'normal' | 'low',
  tags: string[]
) => {
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
const calculateRetryDelay = (attempt: number): number => {
  const retryConfig = getRetryConfig();
  return retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
};

/**
 * Send single email with retry logic
 */
export const sendEmailWithRetry = async (
  to: string,
  subject: string,
  templateName: string,
  data: object,
  options: EmailOptions = {}
): Promise<EmailResult> => {
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
    } catch (error: any) {
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

/**
 * Send bulk emails with rate limiting
 */
export const sendBulkEmails = async (
  emails: EmailData[],
  options: BulkEmailOptions = {}
): Promise<BulkEmailResult> => {
  const { batchSize = 10, delayBetweenBatches = 1000, priority = 'normal' } = options;
  const results: Array<{ to: string; success: boolean; error?: string }> = [];
  let successCount = 0;
  let failedCount = 0;

  console.log(`📧 Starting bulk email send: ${emails.length} emails in batches of ${batchSize}`);

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)}`);

    // Process batch in parallel
    const batchPromises = batch.map(async (email) => {
      const result = await sendEmailWithRetry(email.to, email.subject, email.templateName, email.data, { priority });
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
      } else {
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

/**
 * Get email service status
 */
export const getEmailStatus = (): { config: EmailConfig; retryConfig: RetryConfig } => {
  return {
    config: getEmailConfig(),
    retryConfig: getRetryConfig(),
  };
};

// --- BACKWARD COMPATIBILITY ---

/**
 * Send email (backward compatibility function)
 */
export const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  data: object
): Promise<void> => {
  const result = await sendEmailWithRetry(to, subject, templateName, data);
  if (!result.success) {
    throw new Error(`Failed to send email: ${result.error}`);
  }
};