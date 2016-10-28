var port = process.env.PORT || 5000;
//var port = 8080;
//var port = 8081;
var express = require('express');
var app = express();
var mysql = require('mysql');
var dbinfo = {
  host: 'us-cdbr-iron-east-04.cleardb.net',
  user: 'bc8309dedbcac6',
  password: '5271b38e',
  database: 'heroku_d9a408c946dbc65'
};
var connection;
function handleDisconnect() {
  connection = mysql.createConnection(dbinfo);
  connection.connect(function(err) {
    if (err) {
      console.log("error when connecting to db: ", err);
      setTimeout(handleDisconnect,2000);
    }
  });
  connection.on("error", function(err) {
    console.log("db error", err);
    if (err.code==="PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}
handleDisconnect();

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
  //connection.query("SELECT * FROM saves WHERE filename = ?", req.url, function(err, rows, fields) {
  //  if (err) {
  //    return console.log(err);
  //  }
  //  if (rows.length===0) {
  //    throw new Error();
  //    return;
  //  }
  //  res.send(rows[0].jsondata);
  //});
});
app.get('/saves/', function(req, res) {
  console.log("Received GET request: " + req.url);
  connection.query("SELECT filename FROM saves", function(err, rows, fields) {
    console.log("pulled this many filenames: " + rows.length);
    if (err) {
      return console.log(err);
    }
    rows = rows.map(function(a,e,i) {return e.filename;});
    // clean the array
    for (var i=0; i<rows.length; i++) {
      if (rows[i]===null || rows[i]===undefined) {
        rows.splice(i,1);
        i--;
      }
    }
    if (rows.length===0) {
      res.send(" ");
    } else {
      res.send(JSON.stringify(rows));
    }
  });
});
app.post('/saves/*.json', function (req, res) {
  console.log("Received POST request: " + req.url);
  console.log("Received list of " + req.body.things.length + " things.");
  connection.query("SELECT filename FROM saves WHERE filename = ?", [req.url], function(err, rows) {
    console.log("length of rows is " + rows.length);
    // for now, do not check for errors
    var stringified= JSON.stringify(req.body);
    global.gc();
    console.log("length of stringified is "+stringified.length);
    connection.query("INSERT INTO saves (filename, jsondata) VALUES (?, '" + stringified +"')",[req.url],function(err) {
      if (err) {
        return console.log(err);
      }
      console.log("probably those rows made it into there");
    });
    setTimeout(function() {global.gc();},2000);
  });
  console.log("Saved file "+req.url);
});

app.listen(port, function () {
  console.log('Example app listening on port' + port + '.');
});
setInterval(function() {connection.ping();},10000);
