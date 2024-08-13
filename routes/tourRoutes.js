const express = require('express');

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const app = express();

const router = express.Router();

//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   );

// test routes
router.route('/all').get(tourController.gat);
router.route('/tstats').get(tourController.gts);
router.route('/m-stat/:year').get(tourController.getMonthlyTour);
//

router.use('/:tourId/reviews', reviewRouter);

// router.param('id', tourController.checkId);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin', 'guide'),
    tourController.getMonthlyCounts,
  );

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)

  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  ); // tourController.checkBody is a middleware used to check the request data is present in required pattern or not
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.deleteTour,
  );

module.exports = router;
