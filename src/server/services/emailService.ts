import { Resend } from "resend";

/**
 * Email Service for Scholarship Hunter
 * Handles all email communications including recommendation requests and reminders
 */

const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || "Scholarship Hunter <noreply@scholarshiphunter.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Format date for display in emails
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Recommendation Request Email Parameters
 */
interface RecommendationRequestParams {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  recommenderName: string;
  recommenderEmail: string;
  scholarshipName: string;
  deadline: Date;
  uploadLink: string;
  personalMessage?: string;
}

/**
 * Send initial recommendation request email
 */
export async function sendRecommendationRequest({
  studentName,
  studentEmail,
  studentPhone,
  recommenderName,
  recommenderEmail,
  scholarshipName,
  deadline,
  uploadLink,
  personalMessage,
}: RecommendationRequestParams) {
  const emailContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 20px 0;
          }
          .deadline {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p>Dear ${recommenderName},</p>

          <p>I hope this message finds you well. I am applying for the <strong>${scholarshipName}</strong> scholarship, and I would be honored if you would write a letter of recommendation on my behalf.</p>

          ${personalMessage ? `<p>${personalMessage}</p>` : ""}

          <div class="deadline">
            <strong>⏰ Important Deadline:</strong><br>
            The letter should be submitted by <strong>${formatDate(deadline)}</strong>
          </div>

          <p>To submit your recommendation letter, please use this secure link:</p>

          <a href="${uploadLink}" class="button">Upload Recommendation Letter</a>

          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link in your browser:<br>${uploadLink}</p>

          <p>Your letter should be uploaded as a PDF or DOCX file (maximum 10MB).</p>

          <p>Thank you so much for your support. Please let me know if you have any questions or need additional information.</p>

          <p>Best regards,<br>
          <strong>${studentName}</strong><br>
          ${studentEmail}${studentPhone ? `<br>${studentPhone}` : ""}</p>

          <div class="footer">
            <p>This is an automated email from Scholarship Hunter on behalf of ${studentName}. If you have any questions about this request, please contact the student directly using the information above.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recommenderEmail,
      replyTo: studentEmail,
      subject: `Recommendation Request for ${studentName} - ${scholarshipName}`,
      html: emailContent,
    });
  } catch (error) {
    console.error("Failed to send recommendation request email:", error);
    throw new Error("Failed to send recommendation request email");
  }
}

/**
 * Recommendation Reminder Email Parameters
 */
interface RecommendationReminderParams {
  studentName: string;
  recommenderName: string;
  recommenderEmail: string;
  scholarshipName: string;
  deadline: Date;
  uploadLink: string;
  daysUntilDue: number;
}

/**
 * Send reminder email to recommender
 */
export async function sendRecommendationReminder({
  studentName,
  recommenderName,
  recommenderEmail,
  scholarshipName,
  deadline,
  uploadLink,
  daysUntilDue,
}: RecommendationReminderParams) {
  const emailContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 20px 0;
          }
          .deadline {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p>Dear ${recommenderName},</p>

          <p>This is a friendly reminder that ${studentName}'s recommendation letter for the <strong>${scholarshipName}</strong> scholarship is due soon.</p>

          <div class="deadline">
            <strong>⏰ Deadline Approaching:</strong><br>
            Due on <strong>${formatDate(deadline)}</strong> (in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"})
          </div>

          <p>If you've already submitted the letter, please disregard this message. Otherwise, you can upload your letter using this secure link:</p>

          <a href="${uploadLink}" class="button">Upload Recommendation Letter</a>

          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link in your browser:<br>${uploadLink}</p>

          <p>Thank you for supporting ${studentName}!</p>

          <p>Best regards,<br>
          <strong>Scholarship Hunter Team</strong></p>

          <div class="footer">
            <p>This is an automated reminder from Scholarship Hunter. If you have any questions, please contact ${studentName} directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recommenderEmail,
      subject: `Reminder: Recommendation for ${studentName} Due in ${daysUntilDue} Day${daysUntilDue === 1 ? "" : "s"}`,
      html: emailContent,
    });
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    throw new Error("Failed to send reminder email");
  }
}

/**
 * Recommendation Confirmation Email Parameters
 */
interface RecommendationConfirmationParams {
  recommenderName: string;
  recommenderEmail: string;
  studentName: string;
  scholarshipName: string;
}

/**
 * Send confirmation email to recommender after successful upload
 */
export async function sendRecommendationConfirmation({
  recommenderName,
  recommenderEmail,
  studentName,
  scholarshipName,
}: RecommendationConfirmationParams) {
  const emailContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .success {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 12px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p>Dear ${recommenderName},</p>

          <div class="success">
            <strong>✓ Recommendation Letter Received</strong><br>
            Your recommendation letter for ${studentName} has been successfully uploaded.
          </div>

          <p>Thank you for submitting your recommendation letter for ${studentName}'s application to the <strong>${scholarshipName}</strong> scholarship.</p>

          <p>Your support means a great deal to ${studentName}, and we greatly appreciate your time and effort in writing this letter.</p>

          <p>Best regards,<br>
          <strong>Scholarship Hunter Team</strong></p>

          <div class="footer">
            <p>This is an automated confirmation from Scholarship Hunter.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recommenderEmail,
      subject: `Confirmation: Recommendation Letter Received for ${studentName}`,
      html: emailContent,
    });
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    // Don't throw error - confirmation email is nice-to-have
  }
}

/**
 * Student Notification Email Parameters
 */
interface StudentNotificationParams {
  studentEmail: string;
  studentName: string;
  recommenderName: string;
  scholarshipName: string;
}

/**
 * Notify student when recommendation is received
 */
export async function notifyStudentRecommendationReceived({
  studentEmail,
  studentName,
  recommenderName,
  scholarshipName,
}: StudentNotificationParams) {
  const emailContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .success {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 12px;
            margin: 20px 0;
          }
          .button {
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p>Hi ${studentName},</p>

          <div class="success">
            <strong>🎉 Good News!</strong><br>
            ${recommenderName} has submitted your recommendation letter.
          </div>

          <p>Your recommendation letter for the <strong>${scholarshipName}</strong> scholarship has been received from ${recommenderName}.</p>

          <p>You're one step closer to completing your application!</p>

          <a href="${APP_URL}/dashboard/applications" class="button">View Application Progress</a>

          <p>Best of luck with your application!</p>

          <p>Best regards,<br>
          <strong>Scholarship Hunter Team</strong></p>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: studentEmail,
      subject: `Recommendation Letter Received from ${recommenderName}`,
      html: emailContent,
    });
  } catch (error) {
    console.error("Failed to send student notification email:", error);
    // Don't throw error - notification email is nice-to-have
  }
}
