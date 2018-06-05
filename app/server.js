const dotenv = require('dotenv');
const dotenvParseVariables = require('dotenv-parse-variables');
 
let env = dotenv.config({})
if (env.error) throw env.error;
env = dotenvParseVariables(env.parsed);
const config = require('../config');
const path = require('path');
const express = require('express');
const app = express();
var server = app.listen(Number(env.SOCKET));
var io = require('socket.io').listen(server);


function start(){
	console.log('starting server');
	//Static front-end assets
	app.use(express.static('public'));
	//Templates
	app.set('view engine', 'pug');
	app.set('views', env.VIEWS_DIR);

	//Set up the routes
	require('./router')(app, io);
}


module.exports = {
	start: start
};





