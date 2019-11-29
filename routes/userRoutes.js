const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/update-my-password', [
  authController.protectRoute,
  authController.updatePassword
]);
router.patch(
  '/update-me',
  authController.protectRoute,
  userController.updateMe
);
router.delete(
  '/delete-me',
  authController.protectRoute,
  userController.deleteMe
);

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
