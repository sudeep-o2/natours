const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const Mongoose = require('mongoose');
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION!   SHUTTING DOWN...');
  process.exit(1);
});
//console.log(app.get('env'));

//console.log(process.env);  // to log all env variables

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

Mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
}).then((con) => {
  //console.log(con.connections);
  console.log('db connected');
});

// const testTour = new Tour({
//   name: 'The Hill Hiking',
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => console.log('Error', err));

// start server
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!   SHUTTING DOWN...');
  server.close(() => {
    process.exit(1);
  });
});
