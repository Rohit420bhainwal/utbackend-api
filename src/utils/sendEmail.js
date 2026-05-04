
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendOtpEmail = async (to, otp) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject: "Verify your account - OTP",
      html: `
        <div style="font-family: Arial; text-align: center;">
          <h2>UTSave OTP Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 3px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
  } catch (error) {
    console.error("SendGrid Error:", error.response?.body || error.message);
    throw new Error("Failed to send OTP email");
  }
};


/*
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // app password
  },
});

exports.sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"UTSave" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your account - OTP",
    html: `
      <h2>OTP Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
    `,
  });
};
*/