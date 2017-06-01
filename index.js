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
  // console.log(' -=- > Connect');

  var rooms = config.rooms;
  for (var r in rooms) {
	  this.join(rooms[r]);
  }

  // fetch and print roster contacts (buddy list)
  // this.getRoster(function(err, items, stanza) {
  //   if (err) {
  //     console.log(' -=- > Error getting roster: ' + err);
  //     return;
  //   }
  //   items.forEach(function(item) {
  //     console.log(' -=- > Roster contact: ' + item.name);
  //   });
  // });
});

bot.onMessage('catbot', function(channel, from, message) {
	// console.log(' -=- > ' + from + '@' + channel + ' said: ' + message);

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

		console.log('valid pokemon request');

		requestInMotionFlag = true;
		var pkmn = msg[1];

		if (pkmn === "help") {
			self.message(channel, "`pokemon name/number` or `pokemon help` to get this message. Gen 6 or lower. Uses https://pokeapi.co");

			cooldown();
		} else {

			// IDEA: Configuration of funny responses to specific triggers
			if (pkmn === "missingno") {
				self.message(channel, "http://i.imgur.com/YyChnZM.gif");

				cooldown();
			} else {

				var sprite = '';
				var name = '';
				var number = '';

				// Get base info
				request('http://pokeapi.co/api/v2/pokemon/' + pkmn, function (error, response, body) {
				    if (!error && response.statusCode == 200) {
						pokemon = JSON.parse(body);

						console.log('requesting ' + pkmn + ' base info');

						var sprites = pokemon["sprites"];
						if (sprites.front_default !== null) {
							sprite = sprites.front_default;
						}

						number = pokemon["id"];
						name = pokemon["name"];

						var species_url = pokemon["species"].url;

						// Get name
						request(species_url, function (error, response, body) {
						    if (!error && response.statusCode == 200) {
								species = JSON.parse(body);

								console.log('requesting pokemon species info');

								var names = species["names"];

								for (var n in names) {
									if (names.hasOwnProperty(n)) {

										var lang = names[n];

										if (lang["language"].name === "en") {
											name = lang["name"];
										}

									}
								}

								self.message(channel, '#' + number + ': ' + name);
								if (sprite != '') {
									self.message(channel, sprite);
								} else {
									self.message(channel, 'No sprite found =(');
								}

								cooldown();

							} else {

								self.message(channel, 'Unable to retrieve species info =(');
								if (sprite != '') {
									self.message(channel, sprite);
								} else {
									self.message(channel, 'No sprite found =(');
								}

								cooldown();

							}
						});


				    } else {

						self.message(channel, '(shrug)');

						cooldown();

					}
				});
			}
		}
	}
});

// Kill
bot.onMessage('!goaway', function(channel, from, message) {

	if (from == config.boss) {
		this.disconnect();
	}

});

function cooldown() {

	requestInMotionFlag = false;
	cooldownFlag = true;

	setTimeout(function () {
		cooldownFlag = false;
	}, 3000);

}
