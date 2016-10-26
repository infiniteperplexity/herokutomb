var express = require("express");
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'us-cdbr-iron-east-04.cleardb.net',
  user: 'bc8309dedbcac6',
  password: '5271b38e',
  database: 'heroku_d9a408c946dbc65'
});
connection.connect();
var app = express();

app.get('/', function(request, response) {
    //connection.query("create table test (fname varchar(20), lname varchar(20));");
    //connection.query("insert into test values('Glenn','Wright');");
    connection.query("select* from test", function(err, rows, fields) {
      if (err) {
        console.log("error: ", err);
        throw err;
      }
      response.send(["Hello world!", rows]);
    });
    //response.send(connection.state);
    //response.send('Hello World!!!! HOLA MUNDO!!!!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
