"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificatePDFKit = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const generateCertificatePDFKit = async (data) => {
    return new Promise((resolve, reject) => {
        try {
            const PAGE_WIDTH = 595.28;
            const PAGE_HEIGHT = 841.89;
            const doc = new pdfkit_1.default({
                size: "A4",
                margin: 40,
            });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", (err) => reject(err));
            // === Background Gradient ===
            const gradient = doc.linearGradient(0, 0, 0, PAGE_HEIGHT);
            gradient.stop(0, "#f9f7f2").stop(1, "#f2eee9");
            doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(gradient);
            // === Gold Frame with Double Border ===
            doc.save();
            doc.lineWidth(12).strokeColor("#c8a951");
            doc.rect(25, 25, PAGE_WIDTH - 50, PAGE_HEIGHT - 50).stroke();
            doc.lineWidth(1.5).strokeColor("#e5d59a");
            doc.rect(40, 40, PAGE_WIDTH - 80, PAGE_HEIGHT - 80).stroke();
            doc.restore();
            // === Title & Header ===
            doc.fillColor("#2c3e50").font("Helvetica-Bold").fontSize(26);
            doc.text("CodeTutor LMS", 0, 80, { align: "center" });
            doc.font("Helvetica").fontSize(10).fillColor("#7f8c8d");
            doc.text("Official Certificate of Completion", 0, 106, {
                align: "center",
                characterSpacing: 2,
            });
            // Gold Accent Line
            doc.save()
                .lineWidth(2)
                .strokeColor("#c8a951")
                .moveTo((PAGE_WIDTH - 180) / 2, 123)
                .lineTo((PAGE_WIDTH + 180) / 2, 123)
                .stroke()
                .restore();
            // === Main Heading ===
            doc.font("Times-Bold").fontSize(38).fillColor("#2c3e50");
            doc.text("Certificate of Achievement", 0, 150, { align: "center" });
            // === Subtitle ===
            doc.font("Helvetica").fontSize(14).fillColor("#555");
            doc.text("This certifies that", 0, 220, { align: "center" });
            // === Student Name ===
            doc.font("Times-Bold").fontSize(32).fillColor("#2c3e50");
            doc.text(data.studentName, 0, 250, { align: "center" });
            const nameWidth = doc.widthOfString(data.studentName);
            const nameX = (PAGE_WIDTH - nameWidth) / 2;
            doc.save()
                .lineWidth(2)
                .strokeColor("#c8a951")
                .moveTo(nameX, 285)
                .lineTo(nameX + nameWidth, 285)
                .stroke()
                .restore();
            // === Course Title ===
            doc.font("Helvetica").fontSize(14).fillColor("#555");
            doc.text("has successfully completed the course", 0, 305, { align: "center" });
            doc.font("Helvetica-Bold").fontSize(18).fillColor("#5a4fcf");
            doc.text(`"${data.courseTitle}"`, 0, 330, { align: "center" });
            // === Description ===
            doc.font("Helvetica").fontSize(13).fillColor("#555");
            doc.text("in recognition of dedication, perseverance, and commitment to continuous learning.", 80, 360, { align: "center", width: PAGE_WIDTH - 160 });
            // === Divider ===
            doc.lineWidth(1).strokeColor("#dcdcdc");
            doc.moveTo(80, 420).lineTo(PAGE_WIDTH - 80, 420).stroke();
            // === Certificate Details (left) ===
            const detailsX = 90;
            let y = 440;
            doc.font("Helvetica").fontSize(11).fillColor("#7f8c8d");
            doc.text("Certificate ID:", detailsX, y);
            doc.text("Issued On:", detailsX, (y += 20));
            doc.text("Completion Date:", detailsX, (y += 20));
            doc.font("Helvetica-Bold").fillColor("#2c3e50");
            y = 440;
            doc.text(data.certificateId, detailsX + 110, y);
            doc.text(data.issueDate, detailsX + 110, (y += 20));
            doc.text(data.completionDate, detailsX + 110, (y += 20));
            // === Watermark Logo ===
            doc.save();
            doc.opacity(0.06);
            doc.fontSize(98).font("Helvetica-Bold");
            doc.fillColor("#2c3e50");
            doc.text("CodeTutor.", 0, PAGE_HEIGHT / 2 - 60, { align: "center" });
            doc.restore();
            // === Signature Area ===
            const sigY = 560;
            const leftX = PAGE_WIDTH / 2 - 180;
            const rightX = PAGE_WIDTH / 2 + 50;
            // Instructor signature (if available)
            if (data.instructorSignatureUrl) {
                try {
                    doc.image(data.instructorSignatureUrl, leftX + 10, sigY - 45, {
                        width: 100,
                        height: 35,
                    });
                }
                catch {
                    /* ignore image errors */
                }
            }
            doc.lineWidth(1).strokeColor("#34495e");
            doc.moveTo(leftX, sigY).lineTo(leftX + 130, sigY).stroke();
            doc.font("Helvetica").fontSize(10).fillColor("#555");
            doc.text(data.instructorName || "Instructor", leftX, sigY + 8, {
                width: 130,
                align: "center",
            });
            doc.font("Helvetica").fontSize(8).fillColor("#888");
            doc.text("Course Instructor", leftX, sigY + 22, { width: 130, align: "center" });
            // Admin signature
            if (data.adminSignatureUrl) {
                try {
                    doc.image(data.adminSignatureUrl, rightX + 10, sigY - 45, {
                        width: 100,
                        height: 35,
                    });
                }
                catch {
                    /* ignore image errors */
                }
            }
            doc.lineWidth(1).strokeColor("#34495e");
            doc.moveTo(rightX, sigY).lineTo(rightX + 130, sigY).stroke();
            doc.font("Helvetica").fontSize(10).fillColor("#555");
            doc.text(data.adminName || "Platform Administrator", rightX, sigY + 8, {
                width: 130,
                align: "center",
            });
            doc.font("Helvetica").fontSize(8).fillColor("#888");
            doc.text("Administrator", rightX, sigY + 22, { width: 130, align: "center" });
            // === Footer Line & Message ===
            doc.lineWidth(1).strokeColor("#c8a951");
            doc.moveTo(80, PAGE_HEIGHT - 100).lineTo(PAGE_WIDTH - 80, PAGE_HEIGHT - 100).stroke();
            doc.font("Helvetica").fontSize(9).fillColor("#95a5a6");
            doc.text("This certificate is digitally verified by CodeTutor LMS and can be authenticated online.", 0, PAGE_HEIGHT - 85, { align: "center" });
            // === Finish ===
            doc.end();
        }
        catch (err) {
            reject(new Error(`Failed to generate certificate: ${err.message}`));
        }
    });
};
exports.generateCertificatePDFKit = generateCertificatePDFKit;
//# sourceMappingURL=pdfGenerator.js.map