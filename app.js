const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`
  // });
  const error = new Error(`Can't find ${req.originalUrl} on this server`);
  error.statusCode = 404;
  error.status = 'fail';
  // NODE: if we pass an arg into next() func, express will automaticlly assume that that arg is an error, and it will
  // then skip all other middlewares, and it will pase the error to the middleware function for handling global errors
  next(error);
});

// CENTRAL MIDDLEWARE FOR HANDLING GLOBAL ERRORS
// by specifing 4 args, express automatically knows that this is 
// error handling middleware
app.use((error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message
  });
});

module.exports = app;
