var express = require('express');
var bodyParser = require('body-parser');
var timeout = require('connect-timeout');
var cors = require('cors');
var file = require('../routes/index.js');

/**
 * Express configuration
 */
module.exports = function(app) {
	app.use(bodyParser.json());
	app.use(timeout('5s'));
	app.use(cors());
	app.use(file.setup());
};