var port = process.env.PORT || 5000;
//var port = 8080;
//var port = 8081;
var express = require('express');
var app = express();
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'us-cdbr-iron-east-04.cleardb.net',
  user: 'bc8309dedbcac6',
  password: '5271b38e',
  database: 'heroku_d9a408c946dbc65'
});
connection.connect();


var fs = require('fs');
var bodyParser = require('body-parser');
var path = "C:/Users/m543015/Desktop/GitHub/hellatomb";
app.use(express.static('public'));
//app.use(bodyParser.json({limit: '50mb'}));

function serveFile(req, res) {
  console.log("Received GET request: " + req.url);
  res.sendFile(__dirname + req.url);
}
app.get('/', function (req, res) {
  console.log("Received GET request: " + req.url);
  res.sendFile(__dirname +"/index.html");
});
app.get('/*.html', serveFile);
app.get('/*.js', serveFile);
app.get('/*.json', function(req, res) {
  console.log("Received GET request: " + req.url);
  fs.readFile(__dirname + req.url, 'utf8', function(err, data) {
    if (err) {
      return console.log(err);
    }
    console.log(Objects.keys(data));
    res.send(data);
  });
});
app.get('/saves/', function(req, res) {
  console.log("Received GET request: " + req.url);
  fs.readdir(__dirname + '/saves/', function(err, data) {
    if (err) {
      return console.log(err);
    }
    res.send(JSON.stringify(data));
  });
});
app.post('/saves/*.json', function (req, res) {
  console.log("Received POST request: " + req.url);
  console.log("Received list of " + req.body.things.length + " things.");
  fs.writeFile("." + req.url, JSON.stringify(req.body), function(err) {
    if(err) {
      return console.log(err);
    }
  });
  console.log("Saved file "+req.url);
});
app.listen(port, function () {
  console.log('Example app listening on port' + port + '.');
});
