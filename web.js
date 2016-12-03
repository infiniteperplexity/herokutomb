var port = process.env.PORT || 5000;
//var port = 8080;
//var port = 8081;
var express = require('express');
var app = express();
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var uuid = require('uuid');

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
app.use(cookieParser());
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
app.get('/*.ttf', serveFile);
app.get('/cookie', function(req, res) {
  res.cookie("herukotomb_owner", uuid.v4()).send("Cookie is set");
});

app.get('/saves/*', function(req, res) {
  var owner = req.cookies.herokutomb_owner;
  res.set("Connection", "close");
  var urlfrags = req.url.split("/");
  global.gc();
  ram("start of save file GET");
  console.log("Received GET request: " + req.url);
  connection.ping();
  //global.gc();
  connection.query("SELECT * FROM saves WHERE filename = ? AND segment = ?", [urlfrags[3], urlfrags[2]], function(err, rows, fields) {
  //connection.query("SELECT * FROM saves WHERE owner = ? AND filename = ? AND segment = ?", [owner, urlfrags[3], urlfrags[2]], function(err, rows, fields) {
    ram("start of save file query");
    //big jump in memory usage here...
    if (err) {
      return console.log(err);
    }
    if (rows.length===0) {
      res.status(404).send();
    }
    res.send(rows[0].jsondata);
    ram("after sending save file");
    collectAfter();
  });
});

app.get('/saves', function(req, res) {
  //sweepdb();
  var owner = req.cookies.herokutomb_owner;
  res.set("Connection", "close");
  global.gc();
  console.log("Received GET request: " + req.url);
  ram("start of directory GET");
  connection.ping();
  //global.gc();
  connection.query("SELECT DISTINCT filename FROM saves", function(err, rows, fields) {
  //connection.query("SELECT DISTINCT filename FROM saves WHERE owner = ?", [owner], function(err, rows, fields) {
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
app.get('/delete/*', function(req, res) {
  var owner = req.cookies.herokutomb_owner;
  res.set("Connection", "close");
  var urlfrags = req.url.split("/");
  global.gc();
  ram("start of DELETE");
  connection.ping();
  console.log("Received GET request: " + req.url);
  connection.query("DELETE FROM saves WHERE filename = ?",[urlfrags[2]], function(err) {
  //connection.query("DELETE FROM saves WHERE owner = ? AND filename = ?",[owner, urlfrags[3]], function(err) {
    if (err) {
      console.log("error during row deletion for " + req.url);
      console.log(err);
      res.status(404).send();
      return;
    }
    res.send();
  });
});
app.post('/saves/*', function (req, res) {
  var owner = req.cookies.herokutomb_owner;
  res.set("Connection", "close");
  var urlfrags = req.url.split("/");
  global.gc();
  ram("start of POST");
  connection.ping();
  console.log("Received POST request: " + req.url);
  connection.query("DELETE FROM saves WHERE filename = ? AND segment = ?",[urlfrags[3], urlfrags[2]], function(err) {
  //connection.query("DELETE FROM saves WHERE owner = ? AND filename = ? AND segment = ?",[owner, urlfrags[3], urlfrags[2]], function(err) {
    if (err) {
      console.log("error during row deletion for " + req.url);
      console.log(err);
      res.status(404).send();
      return;
    }
    connection.query("INSERT INTO saves (owner, filename, segment, jsondata) VALUES ('none', ?, ?, ?)", [urlfrags[3], urlfrags[2], req.body.json], function(err) {
    //connection.query("INSERT INTO saves (owner, filename, segment, jsondata) VALUES (?, ?, ?, ?)", [owner, urlfrags[3], urlfrags[2], req.body.json], function(err) {
      if (err) {
        console.log("error during row insertion for " + req.url);
        console.log(err);
        res.status(404).send();
        sweepdb();
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

function sweepdb() {
  var correctLength = 18;
  connection.ping();
  connection.query("SELECT DISTINCT filename FROM saves", function(err, rows, fields) {
    if (err) {
      console.log("error in db cleanup sweep");
      console.log(err);
      return;
    }
    rows = rows.map(function(e,i,a) {return e.filename;});
    for (var i=0; i<rows.length; i++) {
      connection.query("SELECT DISTINCT segment FROM saves WHERE filename = ?", [rows[i]], function(err, rows) {
        if (err) {
          console.log("error in db cleanup sweep");
          console.log(err);
          return;
        }
        if (rows.length!==correctLength) {
          connection.query("DELETE FROM saves WHERE filename = ?", [rows[i]], function(err, rows) {
            if (err) {
              console.log("error in db cleanup sweep");
              console.log(err);
              return;
            }
          });
        }
      });
    }
  });
}

function dbcleanup() {
  connection.query("DELETE FROM saves WHERE filename = 'testing'", function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("cleanup succeeded");
  });
}
