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

function collectAfter() {
  setTimeout(function() {global.gc();}, 2000);
}
function ram(str) {
  var mb = parseInt(process.memoryUsage().heapUsed/(1024*1024));
  if (str===undefined) {
    console.log("Memory usage is " + mb + " megabytes.");
  } else {
    console.log("Memory usage at " + str + " is " + mb + " megabytes.");
  }
}
var fs = require('fs');
var bodyParser = require('body-parser');
var path = "C:/Users/m543015/Desktop/GitHub/hellatomb";
//app.use(express.static('public'));
app.use(bodyParser.json({limit: '100mb'}));
//app.use(bodyPArser.urlencoded({limit: '50mb', extended: true}));

function serveFile(req, res) {
  res.set("Connection", "close");
  console.log("Received GET request: " + req.url);
  res.sendFile(__dirname + req.url);
  ram("after serving file");
}
app.get('/', function (req, res) {
  res.set("Connection", "close");
  console.log("Received GET request: " + req.url);
  res.sendFile(__dirname +"/index.html");
});
app.get('/*.html', serveFile);
app.get('/*.js', serveFile);

app.get('/saves/*', function(req, res) {
  res.set("Connection", "close");
  var urlfrags = req.url.split("/");
  global.gc();
  ram("start of save file GET");
  console.log("Received GET request: " + req.url);
  connection.ping();
  //global.gc();
  connection.query("SELECT * FROM saves WHERE filename = ? AND segment = ?", [urlfrags[3], urlfrags[2]], function(err, rows, fields) {
    ram("start of save file query");
    //big jump in memory usage here...
    if (err) {
      return console.log(err);
    }
    if (rows.length===0) {
      res.status(404).send();
    }
    console.log(rows[0].jsondata.substring(1,5));
    res.send(JSON.stringify(rows[0].jsondata));
    ram("after sending save file");
    collectAfter();
  });
});

app.get('/saves', function(req, res) {
  res.set("Connection", "close");
  global.gc();
  console.log("Received GET request: " + req.url);
  ram("start of directory GET");
  connection.ping();
  //global.gc();
  connection.query("SELECT DISTINCT filename FROM saves", function(err, rows, fields) {
    ram("start of directory query");
    if (err) {
      console.log(err);
      res.status(404).send();
      return;
    }
    rows = rows.map(function(e,i,a) {return e.filename;});
    // clean the array
    for (var i=0; i<rows.length; i++) {
      if (rows[i]===null || rows[i]===undefined) {
        rows.splice(i,1);
        i--;
      }
    }
    if (rows.length===0) {
      res.send(" ");
      collectAfter();
    } else {
      //global.gc();
      res.send(JSON.stringify(rows));
      ram("after sending directory");
      collectAfter();
    }
  });
});
app.post('/saves/*', function (req, res) {
  res.set("Connection", "close");
  var urlfrags = req.url.split("/");
  global.gc();
  ram("start of POST");
  connection.ping();
  console.log("Received POST request: " + req.url);
  connection.query("DELETE FROM saves WHERE filename = ? AND segment = ?",[urlfrags[3], urlfrags[2]], function(err) {
    if (err) {
      console.log("error during row deletion for " + req.url);
      console.log(err);
      res.status(404).send();
      return;
    }
    connection.query("INSERT INTO saves (owner, filename, segment, jsondata) VALUES ('Glenn', ?, ?, ?)", [urlfrags[3], urlfrags[2], req.body.json], function(err) {
      if (err) {
        console.log("error during row insertion for " + req.url);
        console.log(err);
        res.status(404).send();
        return;
      }
      ram("after INSERT");
      res.send();
    });
  });
});

app.listen(port, function () {
  console.log('Example app listening on port' + port + '.');
  ram("application start");
  //dbcleanup();
});
setInterval(function() {
  connection.ping();
  ram("ping");
  global.gc();
},10000);

function dbcleanup() {
  connection.query("DELETE FROM saves WHERE filename = 'save' OR filename = 'tiles0' OR filename = 'tiles8'", function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("cleanup succeeded");
  });
}
