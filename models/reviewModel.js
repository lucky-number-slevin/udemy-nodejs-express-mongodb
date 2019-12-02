const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    // MANY Reviews to ONE Tour
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belog to a tour.']
    },
    // MANY Reviews to ONE User
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belog to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// make sure that combination of tour and user field is unique for every tour
// so that the same user cannot create more then one review for the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calculateAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        ratingsCount: { $sum: 1 },
        ratingsAvg: { $avg: '$rating' }
      }
    }
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0] ? stats[0].ratingsCount : 0,
    ratingsAverage: stats[0] ? stats[0].ratingsAvg : 0
  });
};

reviewSchema.post('save', function() {
  this.constructor.calculateAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  // at this stage, query hasn't been executed
  // get the current doc:
  this.review = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // at this stage, query has already been executed
  await this.review.constructor.calculateAverageRatings(this.review.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
