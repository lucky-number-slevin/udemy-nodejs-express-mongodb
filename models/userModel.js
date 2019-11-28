const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
      validator: validator.isEmail,
      message: 'Please provide a valid email'
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

userSchema.pre('save', async function(next) {
  // only run this func if passwrod has been modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // don't persist passwordConfirm
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
