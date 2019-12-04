const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const crypto = require('crypto');

const signToken = userId =>
	jwt.sign({ id: userId._id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN
	});

const getTokenFromHeaders = req => {
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		return req.headers.authorization.split(' ')[1];
	} else if (req.cookies.jwt) {
		return req.cookies.jwt;
	}
	return null;
};

const createAndSendResponseWithToken = (user, statusCode, res) => {
	const token = signToken(user._id);

	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
		),
		httpOnly: true // tells browser to recieve the cookie, store it and send it with every request
		// cannot manipulate or destroy the cookie
	};
	// set only on secure (https) connection
	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

	res.cookie('jwt', token, cookieOptions);

	const userDTO = {
		id: user._id,
		email: user.email,
		name: user.name
	};
	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user: userDTO
		}
	});
};

exports.signup = catchAsync(async (req, res, next) => {
	//   const newUser = await User.create(req.body); // <- this way, user can put any role he wants for them selfs
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm
	});

	const userSettingsUrl = `${req.protocol}://${req.get('host')}/me`;
	await new Email(newUser, userSettingsUrl).sendWelcome();

	createAndSendResponseWithToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return next(new AppError('Missing email and/or password', 400));
	}

	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.isCorrectPassword(password, user.password))) {
		return next(new AppError('Incorrect email and/or password', 401));
	}

	createAndSendResponseWithToken(user, 200, res);
});

exports.logout = (req, res) => {
	// override the "jwt" cookie with some dommy text
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 10000),
		httpOnly: true
	});
	res.status(200).json({ status: 'success' });
};

exports.protectRoute = catchAsync(async (req, res, next) => {
	const token = getTokenFromHeaders(req);

	// check if token has been provided
	if (!token) {
		return next(
			new AppError('You must be logged in to access this route.', 401)
		);
	}

	// verify the token
	const decodedToken = await promisify(jwt.verify)(
		token,
		process.env.JWT_SECRET
	);

	// check if user still exist
	const currentUser = await User.findById(decodedToken.id);
	if (!currentUser) {
		return next(
			new AppError('The user belonging to the token does no longe exist.', 401)
		);
	}

	// check if user changed their password after login
	if (currentUser.isPasswordChangedAfterLogin(decodedToken.iat)) {
		return next(
			new AppError(
				'Password of the user belonging to the token has been changed. Please login again.',
				401
			)
		);
	}

	// grant acces to protected route
	req.user = currentUser;
	res.locals.user = currentUser;
	next();
});

exports.restrictRouteTo = (...roles) => {
	return async (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError('You do not have permission to perform this action', 403)
			);
		}
		next();
	};
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
	// get user based on POST email
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return next(
			new AppError(`There is no user with email "${req.body.email}"`, 404)
		);
	}

	// generate the random reset token
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	// send it to user's email
	const resetURL = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/users/reset-password/${resetToken}`;

	try {
		await new Email(user, resetURL).sendPasswordReset();

		res.status(200).json({
			status: 'success',
			message: 'Token sent to email!'
		});
	} catch (err) {
		// "manualy" handle the error to clear password reset data from user
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });
		return next(
			new AppError('There was an error sending the email. Try again later.')
		);
	}
});

exports.resetPassword = catchAsync(async (req, res, next) => {
	// 1. get user based on the token
	const hashedToken = crypto
		.createHash('sha256')
		.update(req.params.token)
		.digest('hex');

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() }
	});

	// 2. if token has not expired, and there is user, set the new password
	if (!user) {
		return next(new AppError('Token is invalid or has expired', 400));
	}
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();

	// 4. log the user in, send JWT
	createAndSendResponseWithToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
	// 1. get user from collection
	const user = await User.findById(req.user.id).select('+password');
	if (!user) {
		return next(new AppError('Cant find the user...'), 404);
	}
	// 2. check if POST current password is correct
	if (
		!req.body.passwordCurrent ||
		!(await user.isCorrectPassword(req.body.passwordCurrent, user.password))
	) {
		return next(new AppError('Current password is not valid.', 401));
	}
	// 3. if so, update, password
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	await user.save();
	// 4. log user in, send JWT
	createAndSendResponseWithToken(user, 200, res);
});

// Only for rendered pages (no errors) - token should come from cookie
exports.isLoggedIn = async (req, res, next) => {
	// check if token has been provided
	if (!req.cookies.jwt) {
		return next();
	}
	try {
		// verify the token
		const decodedToken = await promisify(jwt.verify)(
			req.cookies.jwt,
			process.env.JWT_SECRET
		);

		// check if user still exist
		const currentUser = await User.findById(decodedToken.id);
		if (!currentUser) {
			return next();
		}

		// check if user changed their password after login
		if (currentUser.isPasswordChangedAfterLogin(decodedToken.iat)) {
			return next();
		}
		// there is a logged in user (pass data into a template)
		res.locals.user = currentUser;
		return next();
	} catch (err) {
		return next();
	}
};
