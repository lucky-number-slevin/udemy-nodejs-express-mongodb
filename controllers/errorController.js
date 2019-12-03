const AppError = require('./../utils/appError');

const sendErrorDev = (err, req, res) => {
	// A) API
	console.error('[DEVELOPMENT ERROR: (API)]', err);
	if (req.originalUrl.startsWith('/api')) {
		return res.status(err.statusCode).json({
			status: err.status,
			err,
			message: err.message,
			stack: err.stack
		});
	}
	// B) RENDERED WEBSITE
	console.error('[DEVELOPMENT ERROR: (rendered website)]', err);
	res.status(err.statusCode).render('error', {
		title: 'Something went wrong',
		message: err.message
	});
};

const sendErrorProd = (err, req, res) => {
	// A) API
	if (req.originalUrl.startsWith('/api')) {
		/// Operational, trusted error: send message to the client
		if (err.isOperational) {
			console.error('[PRODUCTION ERROR: operational (API)]', err);
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message
			});
		}
		// Programming or other unknown error: don't leak error details
		console.error('[PRODUCTION ERROR: non-operational (API)]', err);
		return res.status(500).json({
			status: 'error',
			message: 'Something went wrong!'
		});
	}
	// B) RENDERED WEBSITE
	if (err.isOperational) {
		console.error('[PRODUCTION ERROR: operational (rendered website)]', err);
		return res.status(err.statusCode).render('error', {
			title: 'Something went wrong',
			message: err.message
		});
	}
	// Programming or other unknown error: don't leak error details
	console.error('[PRODUCTION ERROR: non-operational (rendered website)]', err);
	res.status(err.statusCode).render('error', {
		title: 'Something went wrong',
		message: 'Please try again later'
	});
};

const handleCastErrorDB = err => {
	const message = `Invalid ${err.path}: ${err.value}`;
	return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
	const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
	const message = `Duplicate field value: ${
		value[0]
	}. Please use another, unique value.`;
	return new AppError(message, 500);
};

const handleValidationErrorDB = err => {
	const errors = Object.values(err.errors).map(error => {
		return error.message;
	});
	const message = `Ivalid input data. ${errors.join('. ')}`;
	return new AppError(message, 400);
};

const handleJWTError = err =>
	new AppError('Invalid token. Please login again.', 401);

// by specifing 4 args, express automatically knows that this is
// error handling middleware
module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development') {
		sendErrorDev(err, req, res);
	} else if (process.env.NODE_ENV === 'production') {
		let error = { ...err };
		error.message = err.message;
		if (error.name === 'CastError') error = handleCastErrorDB(error);
		else if (error.code === 11000) error = handleDuplicateErrorDB(error);
		else if (error.name === 'ValidationError')
			error = handleValidationErrorDB(error);
		else if (error.name === 'JsonWebTokenError') error = handleJWTError(error);

		sendErrorProd(error, req, res);
	}
};
