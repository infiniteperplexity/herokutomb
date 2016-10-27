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
//app.use(express.static('public'));
app.use(bodyParser.json({limit: '50mb'}));

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
  connection.query("SELECT * FROM saves WHERE filename = ?", req.url, function(err, rows, fields) {
    if (err) {
      return console.log(err);
    }
    if (rows.length===0) {
      throw new Error();
      return;
    }
    res.send(rows[0].jsondata);
  });
});
app.get('/saves/', function(req, res) {
  console.log("Received GET request: " + req.url);
  connection.query("SELECT filename FROM saves", function(err, rows, fields) {
    if (err) {
      return console.log(err);
    }
    if (rows.length===0) {
      res.send(" ");
    } else {
      rows = rows.map(function(a,e,i) {return e.filename;});
      res.send(JSON.stringify(rows));
    }
  });
});
app.post('/saves/*.json', function (req, res) {
  console.log("Received POST request: " + req.url);
  console.log("Received list of " + req.body.things.length + " things.");
  connection.query("SELECT filename FROM saves WHERE filename = ?", req.url, function(err, rows, fields) {
    if (err) {
      return console.log(err);
    }
    if (rows.length>0) {
      connection.query("UPDATE saves SET jsondata = ? WHERE filename = ?", JSON.stringify(req.body), req.url, function(err) {
        if (err) {
          return console.log(err);
        }
      });
    } else {
      connection.query("INSERT INTO saves (filename, jsondata) VALUES (?, ?)", req.url, JSON.stringify(req.body), function(err) {
        if (err) new Promise(function(resolve, reject) {
          return console.log(err);
        });
      });
    }
  });
  console.log("Saved file "+req.url);
});

app.listen(port, function () {
  console.log('Example app listening on port' + port + '.');
});
