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
    response.send(JSON.stringify(connection));
    //response.send('Hello World!!!! HOLA MUNDO!!!!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
