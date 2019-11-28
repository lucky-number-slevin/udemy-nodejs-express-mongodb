const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1. create transporter
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2. define the email options
  const mailOptions = {
    from: 'Slevin Kelevra <slevin.kelevra@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //   html:
  };

  // 3. send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
