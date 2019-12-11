const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION:', err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<USERNAME>',
  process.env.DATABASE_USERNAME
).replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION:', err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Heroku specific configuration,because Heroku
// will shoot down our app every 24 hours
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED, shutting down gracefully');
  // allow all pending request to complete processing
  server.close(() => {
    console.log('Process terminated!');
    // SIGTERM itself will exit our app automatically
  });
});
