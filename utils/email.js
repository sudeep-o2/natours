const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //(1) CREATE A  Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,

    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  //(2) DEFINE EMAIL OPTIONS
  const mailOptions = {
    from: 'Sudeep Savai <sudeep@savai.io>',
    to: options.email,
    subject: options.subject,
    text: options.text,
    //html
  };
  //(3) send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
