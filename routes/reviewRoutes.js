const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({
  mergeParams: true
});

// Protect all routes after this point
router.use(authController.protectRoute);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictRouteTo('user'),
    reviewController.setTourAndUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  // guides should not be able to change, post or delete reviews
  .patch(
    authController.restrictRouteTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictRouteTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
