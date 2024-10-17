const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // mergeparams used to merge route on this route from another router
// POST /tour/2134fajk/reviews
// POST /tour/reviews

router.use(authController.protect);

router
  .route('/')
  .post(
    authController.restrictTo('user'),
    reviewController.setTourIds,
    reviewController.restrictToBookedTour,
    reviewController.createReview,
  )
  .get(reviewController.getAllReviews);

router
  .route('/:id')
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.restrictToBookedTour,
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.setTourIds,
    reviewController.restrictToBookedTour,
    reviewController.updateReview,
  )
  .post(
    reviewController.setTourIds,
    reviewController.restrictToBookedTour,
    reviewController.createReview,
  )
  .get(reviewController.getReview);

module.exports = router;
