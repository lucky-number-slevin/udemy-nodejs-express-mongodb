const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  // allow 100 request in 1h
  max: 10,
  windowMs: 60 * 64 * 1000,
  message: 'Too many request from this IP. Please try again in an hour!'
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// handle all http methods and all unhadled urls
// this would not be reached if one of the above routes had handled the request
app.all('*', (req, res, next) => {
  const error = new AppError(
    `Can't find ${req.originalUrl} on this server`,
    404
  );
  // NODE: if we pass an arg into next() func, express will automaticlly assume that that arg is an error, and it will
  // then skip all other middlewares, and it will pase the error to the middleware function for handling global errors
  next(error);
});

// CENTRAL MIDDLEWARE FOR HANDLING GLOBAL ERRORS
app.use(globalErrorHandler);

module.exports = app;
