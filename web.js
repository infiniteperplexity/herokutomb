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
  ram("start of save file GET");
  console.log("Received GET request: " + req.url);
  connection.ping();
  //global.gc();
  connection.query("SELECT * FROM saves WHERE filename = ?", [req.url.substr(1)], function(err, rows, fields) {
    ram("start of save file query");
    if (err) {
      return console.log(err);
    }
    if (rows.length===0) {
      throw new Error();
      return;
    }
    //global.gc();
    res.send(rows[0].jsondata);
    ram("after sending save file");
  });
});

app.get('/saves/', function(req, res) {
  console.log("Received GET request: " + req.url);
  ram("start of directory GET");
  connection.ping();
  //global.gc();
  connection.query("SELECT filename FROM saves", function(err, rows, fields) {
    ram("start of directory query");
    if (err) {
      return console.log(err);
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
    } else {
      //global.gc();
      res.send(JSON.stringify(rows));
      ram("after sending directory");
    }
  });
});

app.post('/*.json', function (req, res) {
  ram("start of POST");
  connection.ping();
  console.log("Received POST request: " + req.url);
  console.log("Received list of " + req.body.things.length + " things.");
  connection.query("SELECT filename FROM saves WHERE filename = ?", [req.url.substr(1)], function(err, rows) {
    ram("start of first POST query");
    // for now, do not check for errors
    //connnection.ping();
    var stringified = JSON.stringify(req.body);
    ram("after stringifying");
    console.log("just stringified body");
    //connection.ping();
    //global.gc();
    //connection.ping();
    console.log("about to load rows");
    if (rows.length>0) {
      console.log("trying to udpate");
      connection.query("UPDATE saves SET jsondata = '" + stringified + "' WHERE filename = ?", [req.url.substr(1)], function(err) {
        ram("start of row updating");
        if (err) {
          return console.log(err);
        }
        console.log("successfully replaced row?");
      });
    } else {
      console.log("trying to insert");
      connection.query("INSERT INTO saves (filename, jsondata) VALUES (?, '" + stringified +"')",[req.url.substr(1)],function(err) {
        ram("start of row inserting");
        if (err) {
          return console.log(err);
        }
        console.log("successfully loaded row?");
      });
    }
    //setTimeout(function() {global.gc();},2000);
  });
  console.log("Saved file "+req.url);
});

app.listen(port, function () {
  console.log('Example app listening on port' + port + '.');
  ram("application start");
});
setInterval(function() {
  connection.ping();
  //global.gc();
},10000);
