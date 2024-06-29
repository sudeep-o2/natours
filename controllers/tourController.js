//onst fs = require('fs');

const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

// exports.checkId = (req, res, next, val) => {
//   console.log(`the id is ${val}`);
//   const tour = tours.find((el) => el.id === parseInt(req.params.id));

//   if (!tour) {
//     return res.status(404).json({
//       status: 'failed',
//       message: 'InvalidId',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'failed',
//       message: 'bad request',
//     });
//   } else {
//     console.log(req.body.name, req.body.price);
//   }
//   next();
// };

// middleware

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,-price';
  req.query.fields = 'name,price,difficulty,summary,ratingsAverage';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    console.log(req.query);

    // build querry

    //query type 1
    //const tours = tours.find().where('duration').equals(5).where('difficulty').equals('easy')

    // (1)A filtering
    // const queryObj = { ...req.query };
    // const excludeFields = ['page', 'limit', 'sort', 'fields'];
    // excludeFields.forEach((el) => delete queryObj[el]);
    //console.log(queryObj, req.query);

    //query type 2
    // (1)B advance filtering
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);
    //console.log(JSON.parse(queryStr));
    //{ difficulty: 'easy', duration: { gte: '5' } }

    //let query = Tour.find(JSON.parse(queryStr));

    //(2) Sorting
    // if (req.query.sort) {
    //   // console.log(req.query.sort);
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   // console.log(sortBy);
    //   query = query.sort(sortBy);
    // } else {
    //   query = query.sort('-createdAt');
    // }

    // (3) limiting fields

    // if (req.query.fields) {
    //   console.log(req.query.fields);
    //   const fieldSelected = req.query.fields.split(',').join(' ');
    //   query = query.select(fieldSelected);
    // } else {
    //   query = query.select('-__v');
    // }

    // (4) pagination

    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // //console.log(page, limit);
    // const skip = (page - 1) * limit;
    // //console.log(skip);

    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const noTours = await Tour.countDocuments();
    //   if (skip >= noTours) {
    //     throw new Error('This page does not exist');
    //   }
    // }

    // execute query
    const features = new ApiFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours: tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  //   console.log(req.params);
  //   console.log(req.params.id);
  try {
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour: tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: {
        tour: null,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  // console.log(req.body);
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tours: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.7 } },
      },
      {
        $group: {
          //_id: null
          _id: { $toUpper: '$difficulty' },
          // _id: '$ratingsAverage',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: -1 }, // 1 for ascending and -1 for descending
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getMonthlyCounts = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const monthlyplan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStart: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStart: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        monthlyplan,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
};
