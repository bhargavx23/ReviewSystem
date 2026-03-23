const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.NODemailer_HOST || "smtp.gmail.com",
  port: process.env.NODemailer_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP email
const sendOtpEmail = async (email, otp) => {
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
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendBookingEmail };
