const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');
const User = require('../models/userModel');

exports.setTourIds = (req, res, next) => {
  // if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.tour) req.body.tour = req.params.id;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);

// exports.gettopreviews = catchAsync(async(req,res,next) => {
//     const
// })

exports.restrictToBookedTour = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id });
    console.log(bookings);

    const tours = bookings.map((el) => el.tour._id.toString());
    console.log(tours);
    console.log(req.params.id);
    console.log(req.body.tour);

    if (!tours.includes(req.params.id)) {
      return next(new AppError('You have not booked this tour', 403));
    }
    next();
  } catch (err) {
    console.log(err);
  }
};
