const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);

// Protect all routes after this middleware
router.use(authController.protectRoute);

router.patch('/update-my-password', [authController.updatePassword]);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/update-me',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/delete-me', userController.deleteMe);

// Restrict all routes after this middleware to 'admin' only
router.use(authController.restrictRouteTo('admin'));

router.post('/', userController.createUser);

router
  .route('/:id')
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
