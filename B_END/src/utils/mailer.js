const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP email for password reset
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Attendance System" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน - Attendance System',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 16px; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #fff;">
        <h2 style="text-align: center; margin-bottom: 8px;">🔐 ยืนยันตัวตน</h2>
        <p style="text-align: center; color: #ccc; font-size: 14px;">รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ:</p>
        <div style="text-align: center; font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #a78bfa; margin: 28px 0; padding: 20px; background: rgba(255,255,255,0.08); border-radius: 12px; border: 1px solid rgba(167,139,250,0.3);">${otp}</div>
        <p style="text-align: center; color: #999; font-size: 12px;">รหัสนี้จะหมดอายุใน 5 นาที กรุณาอย่าแชร์กับผู้อื่น</p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
        <p style="text-align: center; color: #666; font-size: 11px;">Online Attendance Check-in System</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send notification email
 */
const sendNotificationEmail = async (to, subject, message) => {
  const mailOptions = {
    from: `"Attendance System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: auto; padding: 24px;">
        <h3>${subject}</h3>
        <p>${message}</p>
        <hr />
        <p style="color: #999; font-size: 12px;">Online Attendance Check-in System</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendNotificationEmail };
