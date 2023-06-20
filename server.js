const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const routes = require('./routes');
const config = require('./config.json');

const app = express();

app.use(bodyParser.json());

app.use('/', routes);

// DB connection establishment.
mongoose.connect(config.mongoURI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log('Connection to db has been established.');
    })
    .catch(err => {
          console.error(err);
          process.exit(1);
    }
);


app.use((err, req, res, next) => {
    res.status(500).json({message: err.message});
});


app.listen(3000);
console.log(`App is listening to port 3000.`);