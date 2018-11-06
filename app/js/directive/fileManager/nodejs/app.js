var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var fs = require('fs');
var io = require('socket.io')(server);

process.env.DATA_DIR = process.env.DATA_DIR || 'data';

process.env.PORT = 8081;
app.set('port',process.env.PORT);

require('./config/express')(app);
require("./socket/socket.js")(io);

app.all('/*',
		[ function(req, res, next) {
		     res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
		     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
          res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
		     if (req.method == 'OPTIONS') {
		         res.status(200).end();
		     } 
		     else {
                 next();
		     }
	      }
	    ]
);
	
// Start server
app.listen(app.get('port'), function() {
  console.info('Server started on port %d serving directory Waiting for requests...', process.env.PORT);
});

server.listen(8082, function(){
  console.info('Socket is listening on *:8082');
});


module.exports.app = app;
module.exports.server = server;


