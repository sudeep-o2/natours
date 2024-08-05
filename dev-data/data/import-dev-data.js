const dotenv = require('dotenv');

const Mongoose = require('mongoose');

const Tour = require('../../models/tourModel');

const fs = require('fs');
dotenv.config({ path: './.env' });

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

Mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
})
  .then((con) => {
    //console.log(con.connections);
    console.log('db connected');
  })
  .catch((err) => {
    console.log(err);
  });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

// create data
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('data loaded successfully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('data deleted successfully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

//console.log(process.argv);

if (process.argv[2] === '--import') {
  importData();
} else {
  deleteData();
}
