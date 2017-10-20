const wobot = require('wobot');
const config = require('./bot.json');
const pokemon = require('./modules/pokemon.js');
const fs = require('fs');
const megahal = require('jsmegahal');

var hal = new megahal(4);

var bot = new wobot.Bot({
	jid: config.env.jid,
	password: config.env.password
});

var cooldownFlag = false;
var requestInMotionFlag = false;

var markov = __dirname + '/markov.txt';

bot.connect();

bot.onConnect(function () {
	var rooms = config.rooms;
	for (var r in rooms) {
		this.join(rooms[r]);
		// this.message(rooms[r], '(catbot)');
	}

	fs.readFile(markov, 'utf8', function(err, data) {
		hal.addMass(data);
	});
});

bot.onMessage('catbot', function (channel, from, message) {
	// console.log(' -=- > ' + from + '@' + channel + ' said: ' + message);

	// this.message(channel, '(catbot)');

	var messageSansName = message.replace(/catbot/i, '');

	this.message(channel, hal.getReplyFromSentence(messageSansName));
});

bot.onMessage(/^pokemon.+/, function (channel, from, message) {

	var p = {};
	var self = this;

	var msg = message.split(' ');

	var alert = '';

	// How I want the API to work...
	// var response = pokemon.retrieve(msg);

	if (msg[0] == 'pokemon' &&
		typeof msg[2] === 'undefined' &&
		!requestInMotionFlag &&
		!cooldownFlag) {

		requestInMotionFlag = true;

		response = pokemon.retrieve(msg[1]).then(function (res) {

			for (var i in res) {
				if (res.hasOwnProperty(i)) {
					this.message(channel, res[i]);
				}
			}

			cooldown();

		}.bind(this), function (error) {
			console.log(error);
			this.message(channel, '(shrug) [whoopsie: ' + error + ']');
		}.bind(this));

	}

});

bot.onMessage(/!die|!goaway|!reset/, function (channel, from, message) {

	if (from == config.boss) {
		this.disconnect();
		process.exit();
	}

});

bot.onMessage(/(?!.*?catbot)^.*$/ig, function (channel, from, message) {

	var msg = message.split(' ');

	if (msg[0] !== 'pokemon') {

		writeToLog(__dirname + '/markov.txt', message);

		hal.addMass(message);

	}

});

bot.onMessage(/catbot/i, function (channel, from, message) {

	if (!requestInMotionFlag && !cooldownFlag) {

		requestInMotionFlag = true;

		var messageSansName = message.replace(/catbot/i, '');

		writeToLog(__dirname + '/markov.txt', messageSansName);

		setTimeout(function () {

			this.message(channel, hal.getReplyFromSentence(messageSansName));

		}.bind(this), 1500);

		hal.addMass(messageSansName);

		cooldown();

	}

});

function cooldown() {

	requestInMotionFlag = false;
	cooldownFlag = true;

	setTimeout(function () {
		cooldownFlag = false;
	}, 2000);

}

function writeToLog(file, text) {

	fs.appendFile(file, text + '\r\n', function (err) {
		if (err) return console.log(err);
		console.log('log is updated');
	});

}

