const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const fileUpload = require('express-fileupload');
const userRoute = require('./routes/user');
const videoRoute = require('./routes/video');
const bodyParser = require('body-parser');
const commentRoute = require('./routes/comment')

const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// express-fileupload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Test Route
app.get('/test', (req, res) => {
  res.send('API is running');
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("Error connecting to MongoDB", err));

app.use('/user', userRoute);
app.use('/video', videoRoute);
app.use('/comment', commentRoute);


module.exports = app;