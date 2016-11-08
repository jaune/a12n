require('dotenv').config({ silent: true});

const express = require('express');

var app = express();

app.use('/', express.static(__dirname + '/web'));

app.get('/', function (req, res) {
  res.send('Hello World')
})

var port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('Server started -- *:'+port);
});