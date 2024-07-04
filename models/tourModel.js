const Mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new Mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour should be defined'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name can have maximum 40 characters'],
      minlength: [5, 'Tour name can have minimum 5 characters'],
      //validate: [validator.isAlpha, 'name should be alphabet'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have durations'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: ['A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy,medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4,
      min: [1, 'minimum rating should be 1'],
      max: [5, 'maximum rating should be 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on new doc creation and not on update
          return val < this.price;
        },
        message: `Discount price ({VALUE}) should be less than actual price `,
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a coverimage'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Mongoose
// Document middleware - runs before .save() and .create()  also called as (pre hook)
tourSchema.pre('save', function (next) {
  //console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// post middleware

// tourSchema.post('save', function (doc, next) {
//   console.log(this);
//   next();
// });

// Query Middleware

//tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  console.log(`time taken for Query to execute is ${Date.now() - this.start} `);
  //console.log(doc);
  next();
});

// Aggregation pipeline middleware

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = Mongoose.model('Tour', tourSchema);

module.exports = Tour;
