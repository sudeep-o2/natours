const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');
const { text } = require('express');
// const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    // this.from = `Sudeep Savai <${process.env.EMAIL_FROM}>`;
    this.from = `Sudeep Savai <${process.env.MAILSENDER_EMAIL_FROM}>`;
    // this.from = `trial-0r83ql35jzp4zw1j.mlsender.net`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // mailersend
      console.log('in prod');
      return nodemailer.createTransport({
        host: process.env.MAILERSEND_EMAIL_HOST,
        port: process.env.MAILERSEND_EMAIL_PORT,
        secure: false,

        auth: {
          user: process.env.MAILER_SENDER_USERNAME,
          pass: process.env.MAILER_SENDER_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,

      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //1 render html based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2 define email options

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    //3 create transport
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 min)',
    );
  }
};

// const sendEmail = async (options) => {
//   //(1) CREATE A Transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,

//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
//   //(2) DEFINE EMAIL OPTIONS
//   const mailOptions = {
//     from: 'Sudeep Savai <sudeep@savai.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.text,
//html
//(3) send email
// await transporter.sendMail(mailOptions);

// module.exports = sendEmail;
