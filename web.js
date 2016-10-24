var express = require("express");
var mysql = require('mysql');
var app = express();

var db_config = {
    host: 'us-cdbr-east-04.cleardb.com',
    user: 'b6d6c6e8740d20',
    password: 'b3f75ada',
    database: 'heroku_1daa39da0375291'
};

var connection;

app.get('/', function(request, response) {
    response.send('Hello World!!!! HOLA MUNDO!!!!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
