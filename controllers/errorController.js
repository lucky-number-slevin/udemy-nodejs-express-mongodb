// by specifing 4 args, express automatically knows that this is 
// error handling middleware
module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';
  
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    });
  }
