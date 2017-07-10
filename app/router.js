require('dotenv').config();
const config = require('../config');
var app;
var io;
var game;

function initializeHTTPRoutes(_app){
	app = _app;
	//Home page
	app.get('/', (req, res) => {
		res.render('index');
	});


	app.get('/game/', (req, res) => {
		//Most of the logic for this is in the socket connection event
		res.render('game');
	});
}



function initializeIORoutes(_io){
	io = _io;
	game = require('./controller/game')(io);
	io.on('connection', (socket) => {
		if (game.acceptingPlayers() && !authenticatePlayer(socket.id)){
			game.addPlayer(socket);
			initializePlayerSocketRoutes(socket);
		}
		else {
			//This is super sketchy, because you could just open a new tab and spectate, but whatevs
			game.addSpectator(socket);
			initializeSpectatorSocketRoutes(socket);
		}
	});
}


function initializePlayerSocketRoutes(socket){

	socket.on('next', () => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		game.playerReadyForNextTurn(p);
	});


	socket.on('play', () => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		game.changePlayerTimeState(p, 'play');
	});


	socket.on('pause', () => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		game.changePlayerTimeState(p, 'pause');
	});


	socket.on('update behavior params', (params) => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		game.updateSquadBehaviorParams(p, params);
	});


	socket.on('quit', () => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		game.playerQuit(p);
	});
}


function initializeSpectatorSocketRoutes(socket){
	socket.on('quit', () => {});
}


function authenticatePlayer(socket){
	return game.getPlayerFromSocket(socket);
}


module.exports = function(app, io){
	initializeHTTPRoutes(app);
	initializeIORoutes(io);
}





