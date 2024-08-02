const express = require('express');

const fs = require('fs');

const morgan = require('morgan');

const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongosanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorController = require('./controllers/errorController');

// Global middlewares

// set security HTTP headers
app.use(helmet());

// body parser , reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // inside bracket is not mandatory

// Data sanitization against NoSQL querry injection
app.use(mongosanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// used to serve static files from folder
app.use(express.static(`${__dirname}/public`));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit requests from same api
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 30 minutes).
  message:
    'you have reached your maximum request limit try again after half an hour',
});

app.use('/api', limiter);

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

// app.get('/',(req,res) => {
//     res.status(200).json({message:'hello from server',name:'lord'});
// });

// app.post('/',(req,res) => {
//     res.send('u can post data here');
// });

// route handlers

// app.get('/api/v1/tours/:id', getTour);

// app.patch('/api/v1/tours/:id', updateTour);

// app.delete('/api/v1/tours/:id', deleteTour);

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);   // same

// routes

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `could not find ${req.originalUrl} on this server`,
  // });

  // const err = new Error(`could not find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`could not find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorController);

module.exports = app;
