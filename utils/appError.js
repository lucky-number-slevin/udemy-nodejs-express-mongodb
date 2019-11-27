class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
        this.isOperational = true; // indicates that error object is of our custom error class

        // Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
