//onst fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

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

const multerStorage = multer.memoryStorage(); // img is stored as buffer object

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image Please upload image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

//for one- upload.single('image')   req.file
//for multiple- upload.array('images',5)   req.files
//for mixture - upload.fields([{name:'imageCover',maxCount:1},{name:'images}])

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // (1) coverImage
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  // console.log(req.body.imageCover);

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //(2) images

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,difficulty,summary,ratingsAverage';
  next();
};

class apiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // advanced filtering
    const querStr = JSON.stringify(queryObj);
    const replacedString = querStr
      .replace(/"gte":/g, '"$gte":')
      .replace(/"lt":/g, '"$lt":')
      .replace(/"gt":/g, '"$gt":')
      .replace(/"lte":/g, '"$lte":');

    this.query = this.query.find(JSON.parse(replacedString));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

exports.getAllTours = factory.getAll(Tour);
// catchAsync(async (req, res, next) => {
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
//   const features = new ApiFeatures(Tour.find().populate('reviews'), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// catchAsync(async (req, res, next) => {
//   //   console.log(req.params);
//   //   console.log(req.params.id);

//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   // if id is not valid we return the request with 404 error using AppError class
//   if (!tour) {
//     return next(new AppError('No tour is available for this id', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   // if id is not valid we return the request with 404 error using AppError class
//   if (!tour) {
//     return next(new AppError('No tour is available for this id', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: {
//       tour: null,
//     },
//   });
// });

exports.createTour = factory.createOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
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
});

exports.getMonthlyCounts = catchAsync(async (req, res, next) => {
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
});

exports.gat = async (req, res) => {
  try {
    // execute query
    const features = new apiFeatures(Tour, req.query)
      .filter()
      .sort()
      .limit()
      .paginate();

    const tours = await features.query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.gts = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyTour = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const mTours = await Tour.aggregate([
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
        numTourStarts: { $sum: 1 },
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
      $sort: { numTourStarts: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      mTours,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  // console.log(lat, lng, distance, unit, radius);
  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitude and longitude in format lat,lng',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistancs = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // console.log(lat, lng, distance, unit, radius);
  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitude and longitude in format lat,lng',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { data: distances },
  });
});

exports.getTourGroupAverages = catchAsync(async (req, res, next) => {
  const tours = await Tour.aggregate([
    {
      $group: {
        _id: '$ratingsAverage',
        num: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
  ]);

  res.status(200).json({
    result: 'success',
    data: {
      tours,
    },
  });
});
