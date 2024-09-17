const AppError = require('../utils/appError');

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDb = (err) => {
  console.log(err);
  const value = err.keyValue.email || err.keyValue.name;
  //console.log(value);
  const message = `Duplicate field value :${value} , use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `The errors are ${errors.join('. ')} `;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. please login again ', 401);

const sendErrorDev = (err, req, res) => {
  // (A)API
  if (req.originalUrl.startsWith('/api')) {
    console.log(req.originalUrl);
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // (B) RENDERED WEBSITE
  console.error('Error....err', err);
  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // (A) API
  if (req.originalUrl.startsWith('/api')) {
    // (A)operational errors , trusted errors, send response to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,

        // stack: err.stack,
      });
    }
    //(B) progrmming or other errors, please dont leak the errors to the clients

    console.error('Error....err', err);

    return res.status(500).json({
      status: 'error',
      message: 'something went wrong',
    });
  }
  // (B) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'something went wrong',
      msg: err.message,
    });
  }
  // progrmming or other errors, please dont leak the errors to the clients

  console.error('Error....err', err);

  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, req, res);
  } else if (process.env.NODE_ENV === 'development') {
    let error = { ...err };
    error.message = err.message;
    // console.log(error);
    if (error.name === 'CastError') error = handleCastErrorDb(error);
    if (error.code === 11000) error = handleDuplicateFieldsDb(error);
    if (error.name === 'ValidatorError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);

    sendErrorDev(error, req, res);
  }
};
