const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

// Heroku requires this:
app.enable('trust proxy');

// express supports pug engine (and others), but it needs to be installed
app.set('view engine', 'pug');
app.set('veiws', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
	// allow 100 request in 1h
	max: 100,
	windowMs: 60 * 64 * 1000,
	message: 'Too many request from this IP. Please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// Parese data from cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (removes html/js code)
app.use(xss());

// Prevent parameter polution (cleanup query string)
app.use(
	hpp({
		whitelist: [
			'duration',
			'ratingsQuantity',
			'ratingsAverage',
			'maxGroupSize',
			'difficulty',
			'price'
		]
	})
);

// Compress all the text that is being send to the client
app.use(compression());

// Test middleware
app.use((req, res, next) => {
	req.requestTime = new Date().toISOString();
	next();
});

// 3.1) TEMPLATE ROUTES
app.use('/', viewRouter);

// 3.2) API ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// handle all http methods and all unhadled urls
// this would not be reached if one of the above routes had handled the request
app.all('*', (req, res, next) => {
	const error = new AppError(
		`Can't find ${req.originalUrl} on this server`,
		404
	);
	// NOTE: if we pass an arg into next() func, express will automaticlly assume that that arg is an error, and it will
	// then skip all other middlewares, and it will pase the error to the middleware function for handling global errors
	next(error);
});

// CENTRAL MIDDLEWARE FOR HANDLING GLOBAL ERRORS
app.use(globalErrorHandler);

module.exports = app;
