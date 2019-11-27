const AppError = require('./../utils/appError');

const sendErrorDev = (error, res) => {
  res.status(error.statusCode).json({
    status: error.status,
    error,
    message: error.message,
    stack: error.stack
  });
};

const sendErrorProd = (error, res) => {
  /// Operational, trusted error: send message to the client
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    console.error('[ERROR]', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
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

// by specifing 4 args, express automatically knows that this is
// error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    else if (error.code === 11000) error = handleDuplicateErrorDB(error);
    sendErrorProd(error, res);
  }
};
