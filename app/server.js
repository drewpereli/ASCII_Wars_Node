
require('dotenv').config();
const config = require('../config');
const path = require('path');
const express = require('express');
const app = express();
var server = app.listen(8000);
var io = require('socket.io').listen(server);
const game = require('./controller/game')(io);


//Static front-end assets
app.use(express.static('public'));
//Templates
app.set('view engine', 'pug');
app.set('views', process.env.VIEWS_DIR);

//Home page
app.get('/', (req, res) => {
	res.render('index');
})


app.get('/game/', (req, res) => {
	//Most of the logic for this is in the socket connection event
	res.render('game');
})








io.on('connection', (socket) => {
	if (game.acceptingPlayers() && !game.getPlayerFromSocket(socket.id)){
		game.addPlayer(socket);
		//If this is at least the second player, start the game countdown if it hasn't already started
		if (game.players.length >= 2 && game.state !== 'counting down'){
			game.beginGameStartCountdown(config.gameStartCountdownTime);
		}
	}
	else {
		//This is super sketchy, because you could just open a new tab and spectate, but whatevs
		game.addSpectator(socket);
	}
});