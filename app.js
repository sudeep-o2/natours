const express = require('express');

const fs = require('fs');

const morgan = require('morgan');

const app = express();

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorController = require('./controllers/errorController');

//middleware
app.use(express.json());

app.use(express.static(`${__dirname}/public`)); // used to serve static files from folder

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
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
