const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true, // transform to lowercase
    validate: {
      validator: [validator.isEmail, 'Please provide a valid email']
    }
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'A user must have a password']
  },
  passwordConfirm: {
    type: String,
    required: [true, 'You must confirm the password'],
    validate: {
      validator: function(val) {
        return this.password === val;
      },
      message: 'Passwords do not match'
    }
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
