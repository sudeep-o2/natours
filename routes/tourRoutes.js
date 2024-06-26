const express = require('express');

const tourController = require('../controllers/tourController');

const app = express();

const router = express.Router();

// router.param('id', tourController.checkId);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour); // tourController.checkBody is a middleware used to check the request data is present in required pattern or not

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
