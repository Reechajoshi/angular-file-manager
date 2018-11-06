var socket_connection = require("./connection.js");

module.exports = function(io) {
    socket_connection.setup(io);
};

	