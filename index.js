const express = require('express');
const bodyParser = require('body-parser');
const app = express();

module.exports = app
  // body parsing middleware
  .use(bodyParser.json())
  // routing middleware
  .use(require('./api'))
  // error handling middleware
  .use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(err.status || 500).send(err.message);
  });

// handles EADDRINUSE error during testing
if (!module.parent) {
  app.listen(process.env.PORT || 5000, () => {
    console.log('Listening on port 5000...')
  });
}
