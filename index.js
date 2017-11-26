const wobot = require('wobot');
const config = require('./bot.json');
const pokemon = require('./modules/pokemon.js');
const fs = require('fs');
const megahal = require('jsmegahal');
const bukkit = require('./modules/bukkit.js');

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
	}

	fs.readFile(markov, 'utf8', function (err, data) {
		hal.addMass(data);
	});
});

bot.onMessage(/.+/g, function (channel, from, message) {

	if (meetsCriteria('reset', message, channel)) {
		if (from == config.boss) {
			this.disconnect();
			process.exit();
		}
	}

	// Pokemon
	if (meetsCriteria('pokemon', message, channel)) {

		var msg = message.split(' ');

		console.log('hello');

		if (msg[0] == 'pokemon' &&
			typeof msg[2] === 'undefined' &&
			canDo()) {

			warmUp();

			pokemon.retrieve(msg[1]).then(function (res) {
				say(res, channel);
				cooldown();
			}.bind(this), function (error) {
				console.log(error);
				this.message(channel, '(shrug) [whoopsie: ' + error + ']');

				cooldown();
			}.bind(this));

		}

	}

	if (meetsCriteria('bukkit', message, channel)) {

		if (canDo()) {

			console.log('bukkit?');

			warmUp();

			var msg = message.split(' ');

			var gif = "";

			if (message[0] == "!") {
				gif = msg[0].replace('!', '');
			} else {
				gif = msg[1];
			}

			console.log(gif);

			bukkit.get(gif).then(function (data) {
				say(data, channel);
				cooldown();
			}, function (error) {
				cooldown();
			});

		}

	}

	if (meetsCriteria('speak', message, channel)) {

		if (canDo()) {

			warmUp();

			var messageSansName = message.replace(/catbot/i, '');

			messageSansName = fixMessage(messageSansName);

			writeToLog(__dirname + '/markov.txt', messageSansName);

			setTimeout(function () {

				this.message(channel, hal.getReply(messageSansName));

			}.bind(this), 1500);

			hal.addMass(messageSansName);

			cooldown();

		}

	}

	if (canDo()) {

		var msg = message.split(' ');

		if (msg[0] !== 'pokemon') {

			var messageSansName = message.replace(/catbot/i, '');

			messageSansName = fixMessage(messageSansName);

			writeToLog(__dirname + '/markov.txt', messageSansName);

			hal.addMass(messageSansName);

		}

	}

});

function fixMessage(message) {

	if (message.search(/[.!?,;:]$/) === -1) {
		message += '.';
	}

	message.replace(' .', '.');

	return message;

}

function canDo() {
	if (!requestInMotionFlag && !cooldownFlag) {
		return true;
	}
	return false;
}

function warmUp() {
	requestInMotionFlag = true;
}

function cooldown() {

	requestInMotionFlag = false;
	cooldownFlag = true;

	setTimeout(function () {
		cooldownFlag = false;
	}, 2000);

}

function say(response, channel) {
	for (var i in response) {
		if (response.hasOwnProperty(i)) {
			bot.message(channel, response[i]);
		}
	}
}

function writeToLog(file, text) {

	fs.appendFile(file, text + '\r\n', function (err) {
		if (err) return console.log(err);
		console.log('log is updated');
	});

}

function meetsCriteria(tool, message, channel) {

	// console.log('checking criteria for ' + tool);

	var toolConfig = config['config'][tool];
	var validMatch = false;
	var validRoom = false;

	// console.log("config", config);
	// console.log("tool", tool);
	// console.log("toolConfig", toolConfig);

	if (typeof toolConfig != 'undefined' && toolConfig != '' && toolConfig != null) {

		if (typeof toolConfig['room'] != 'undefined') {

			var rooms = toolConfig['room'];

			for (var i in rooms) {
				if (rooms.hasOwnProperty(i)) {

					if (rooms[i] == channel) {
						validRoom = true;
					}

				}
			}

		} else {
			validRoom = true;
		}



		console.log("regex from config", toolConfig['regex']);

		if (typeof toolConfig['regex'] != 'undefined') {
			var regex = new RegExp(toolConfig['regex'], "i");
			console.log("regex", regex);

			console.log(message.match(regex));

			if (message.match(regex) != null) {
				validMatch = true;
			}
		}

	}

	console.log('tool', tool);
	console.log('validMatch', validMatch);
	console.log('validRoom', validRoom);

	return (validMatch && validRoom);

}

