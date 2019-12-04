const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
	constructor(user, url) {
		this.to = user.email;
		this.firstName = user.name.split(' ')[0];
		this.url = url;
		this.from = `Slevin Kelevra <${process.env.EMAIL_FROM}>`;
	}

	createTransport() {
		if (process.env.NODE_ENV === 'production') {
			return 1;
		}
		console.log(' RETURNING NODEMAILER TRANSPORT');
		return nodemailer.createTransport({
			// service: 'Gmail',
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD
			}
		});
	}

	async send(template, subject) {
		// 1. render HTML based on a pug template
		const html = pug.renderFile(
			`${__dirname}/../views/emails/${template}.pug`,
			{
				firstName: this.firstName,
				url: this.url,
				subject
			}
		);

		// 2. define email options
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject,
			html,
			text: htmlToText.fromString(html)
		};

		// 3. create a transport and send email
		await this.createTransport().sendMail(mailOptions);
	}

	async sendWelcome() {
		await this.send('welcome', 'Welcome to the Natours Family!');
	}

	async sendPasswordReset() {
		await this.send(
			'password-reset',
			'Your password reset token (valid for 10 minutes)'
		);
	}
};
