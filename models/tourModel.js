const Mongoose = require('mongoose');

const tourSchema = new Mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour should be defined'],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
});

const Tour = Mongoose.model('Tour', tourSchema);

module.exports = Tour;
