
require('dotenv').config();
const config = require('../config');
const path = require('path');
const express = require('express');
const app = express();
var server = app.listen(Number(process.env.SOCKET));
var io = require('socket.io').listen(server);


function start(){
	console.log('starting server');
	//Static front-end assets
	app.use(express.static('public'));
	//Templates
	app.set('view engine', 'pug');
	app.set('views', process.env.VIEWS_DIR);

	//Set up the routes
	require('./router')(app, io);
}


module.exports = {
	start: start
};





