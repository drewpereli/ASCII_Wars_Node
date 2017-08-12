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
		console.log('connecting...');
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
		if (!p){
			console.log('Player is not validated');
			return;
		} 
		game.playerReadyForNextTurn(p);
	});


	socket.on('play', () => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		game.playerPlay(p);
	});


	socket.on('pause', () => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		game.playerPause(p);
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

	socket.on('disconnect', () => {
		console.log('socket disconnecting...');
		var p = authenticatePlayer(socket);
		if (!p) return;
		//game.playerQuit(p);
		game.restart();
	});


	if (process.env.DEBUG_MODE){
		socket.on('restart', () => {
			console.log('socket restarting');
			var p = authenticatePlayer(socket);
			if (!p) return;
			game.restart();
		});

		socket.on('raise elevation', (tile) => {
			var p = authenticatePlayer(socket);
			if (!p) return;
			var t = game.map.getTile(tile.x, tile.y);
			t.setElevation(t.elevation + 50);
			game.emitTile(t);
		});

		socket.on('lower elevation', (tile) => {
			//console.log('lowering elevation of tile at ' + tile.x + ', ' + tile.y);
			var p = authenticatePlayer(socket);
			if (!p) return;
			var t = game.map.getTile(tile.x, tile.y);
			t.setElevation(t.elevation - 50);
			game.emitTile(t);
		});
	}
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





