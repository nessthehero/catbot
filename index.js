var wobot = require('wobot');
var config = require('./bot.json');
var request = require('request');

var bot = new wobot.Bot({
  jid: config.env.jid,
  password: config.env.password
});

var cooldownFlag = false;
var requestInMotionFlag = false;

bot.connect();

bot.onConnect(function() {
  console.log(' -=- > Connect');

  var rooms = config.rooms;
  for (var r in rooms) {
	  this.join(rooms[r]);
  }

  // fetch and print roster contacts (buddy list)
  this.getRoster(function(err, items, stanza) {
    if (err) {
      console.log(' -=- > Error getting roster: ' + err);
      return;
    }
    items.forEach(function(item) {
      console.log(' -=- > Roster contact: ' + item.name);
    });
  });
});

bot.onMessage('catbot', function(channel, from, message) {
	console.log(' -=- > ' + from + '@' + channel + ' said: ' + message);

	this.message(channel, '(catbot)');
});

bot.onMessage(/^pokemon.+/, function(channel, from, message) {

	var pokemon = {};
	var self = this;

	var msg = message.split(' ');

	if (msg[0] == "pokemon" &&
		typeof msg[2] === 'undefined' &&
		!requestInMotionFlag &&
		!cooldownFlag) {

		requestInMotionFlag = true;
		var pkmn = msg[1];

		request('http://pokeapi.co/api/v2/pokemon/' + pkmn, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
				pokemon = JSON.parse(body);

				// console.log(pokemon.sprites);

				if (pokemon["sprites"].front_default !== null) {
					self.message(channel, pokemon.sprites.front_default);

					requestInMotionFlag = false;
					cooldownFlag = true;

					setTimeout(function () {
						cooldownFlag = false;
					}, 3000);
				}
		    } else {
				self.message(channel, '(shrug)');
			}
		});

	}

});

// Kill
bot.onMessage('!goaway', function(channel, from, message) {

	if (from == config.boss) {
		this.disconnect();
	}

});
