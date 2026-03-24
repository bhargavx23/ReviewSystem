const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;

const transporter = hasEmailConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

// Send OTP email
const sendOtpEmail = async (email, otp) => {
  if (!hasEmailConfig || !transporter) {
    console.warn(
      "⚠️ EMAIL not configured. OTP fallback mode - log to console for development.",
    );
    console.log(`✅ OTP for ${email}: ${otp}`);
    return true;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Review Slot Booking - OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Review Slot Booking System</h2>
          <p>Your OTP for login is:</p>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This OTP expires in 10 minutes.</p>
          <hr>
          <p>Review Slot Booking System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending OTP email to ${email}:`, error.message);
    // In development, still allow login with OTP
    console.log(`⚠️ Fallback: OTP for ${email}: ${otp}`);
    return true;
  }
};

// Send booking notification
const sendBookingEmail = async (email, type, data) => {
  let subject, html;

  if (type === "booked") {
    subject = "Slot Booking Request Submitted";
    html = `
      <h2>Slot Request Submitted</h2>
      <p><strong>Batch:</strong> ${data.batchName}</p>
      <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
      <p><strong>Slot:</strong> ${data.slotNumber}</p>
      <p>Status: Pending - Awaiting Guide Approval</p>
    `;
  } else if (type === "approved") {
    subject = "🎉 Slot Approved!";
    html = `
      <h2>Your slot has been approved!</h2>
      <p><strong>Batch:</strong> ${data.batchName}</p>
      <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
      <p><strong>Slot:</strong> ${data.slotNumber}</p>
      <p><strong>Guide:</strong> ${data.guideName}</p>
    `;
  } else if (type === "rejected") {
    subject = "Slot Request Rejected";
    html = `
      <h2>Slot request rejected</h2>
      <p>Please book another slot.</p>
    `;
  } else if (type === "admin-notify") {
    subject = "New Slot Booking Pending Approval";
    html = `
      <h2>New slot booking request</h2>
      <p><strong>Batch:</strong> ${data.batchName}</p>
      <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
      <p><strong>Slot:</strong> ${data.slotNumber}</p>
      <p><strong>Student:</strong> ${data.studentName}</p>
      <p><strong>Status:</strong> Pending Approval</p>
      <p>Please review in admin panel.</p>
    `;
  }

  if (!hasEmailConfig || !transporter) {
    console.warn(
      `⚠️ Email not configured. Skipping booking email for ${email}`,
    );
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Error sending booking email to ${email}:`, error.message);
  }
};

module.exports = { sendOtpEmail, sendBookingEmail };
