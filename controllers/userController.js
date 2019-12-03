const multer = require('multer');
const sharp = require('sharp');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const handlerFactory = require('./handlerFactory');

// IF WE DO NOT NEED IMAGE PROCESSING
// const multerStorage = multer.diskStorage({
// 	destination: (req, file, callback) => {
// 		callback(null, 'public/img/users');
// 	},
// 	filename: (req, file, callback) => {
// 		const extension = file.mimetype.split('/')[1];
// 		callback(null, `user-${req.user.id}-${Date.now()}.${extension}`);
// 	}
// });

// first, save image as buffer, bcs we are resizing it before saving
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
	if (file.mimetype.startsWith('image')) {
		callback(null, true);
	} else {
		callback(
			new AppError(
				'You must provide an image! Please upload only images.',
				400
			),
			false
		);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
	if (!req.file) return next();

	// set filename to req.file so it can be accessed inside next middlewares
	req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
	// crop img to square
	await sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/users/${req.file.filename}`);

	next();
};

const filterObj = (obj, allowedFields) => {
	const filteredObj = {};
	Object.keys(obj).forEach(key => {
		if (allowedFields.includes(key)) filteredObj[key] = obj[key];
	});
	return filteredObj;
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
exports.createUser = handlerFactory.createOne(User);
// Do NOT update password with this
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);

exports.getMe = (req, res, next) => {
	req.params.id = req.user.id;
	next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
	// create error if user POST password data
	if (req.body.password || req.body.passwordConfirm) {
		return next(
			new AppError(
				'This route is not for password updates. Please use /update-my-password',
				400
			)
		);
	}

	// update user document
	const filteredBody = filterObj(req.body, ['name', 'email']);
	if (req.file) filteredBody.photo = req.file.filename;
	const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
		new: true,
		runValidators: true
	});

	res.status(200).json({
		status: 'success',
		data: {
			user: updatedUser
		}
	});
});

exports.deleteMe = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { active: false });
	res.status(204).json({
		status: 'success',
		data: null
	});
});
