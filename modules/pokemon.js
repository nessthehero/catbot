const util = require('util');
const request = require('request');
const config = require('../bot.json');

module.exports = {

	special: [
		{
			'key': 'random',
			'response': 'random'
		},
		{
			'key': 'missingno',
			'response': 'manual',
			'manual': ['http://i.imgur.com/YyChnZM.gif']
		},
		{
			'key': 'pikablu',
			'response': 'api',
			'api': ['183']
		},
		{
			'key': 'pupper',
			'response': 'api',
			'api': ['58', '228', '209', '235', '261', '309', '447', '506']
		},
		{
			'key': 'doggo',
			'response': 'api',
			'api': ['59', '229', '210', '245', '262', '310', '448', '507', '508', '676']
		},
		{
			'key': 'zipzapcat',
			'response': 'api',
			'api': ['243']
		},
		{
			'key': 'snek',
			'response': 'api',
			'api': ['23', '24']
		}
	],

	endpoint: 'http://pokeapi.co/api/v2/pokemon/%s',
	maximum: 802,

	retrieve: function (msg) {

		// console.log('pokemon - inside retrieve');
		// console.log('msg - ', msg);

		var response = [];
		var alert = 0;

		msg = msg.toLowerCase();

		if (msg.indexOf('!') > -1) {
			alert = 1;
			msg = msg.replace(/!/g, '');
		}

		// Check for help
		if (msg === 'help') {
			response.push('`pokemon name/number` or `pokemon help` to get this message. Gen 7 or lower. Max # is ' + this.maximum + '. Uses https://pokeapi.co');
			response.push('Add a ! after the pokemon name/number to alert the room');
			response.push('Also available: random, missingno, pikablu, pupper, doggo');
		}

		// Check special
		for (var j in this.special) {
			if (msg === this.special[j].key) {
				return this.parseSpecial(this.special[j]);
			}
		}

		// Check API or return existing response
		if (response.length > 0) {
			return new Promise(function (resolve, reject) {
				resolve(response);
			});
		} else {
			return this.api(msg, alert);
		}

	},

	parseSpecial: function (special) {

		switch (special.response) {

			case 'manual':

				var r = special.manual[Math.floor(Math.random() * special.manual.length)];

				return Promise.resolve([r]);

				break;

			case 'api':

				var r = special.api[Math.floor(Math.random() * special.api.length)];

				return new Promise(function (resolve, reject) {
					this.api(r).then(function (res) {
						resolve(res);
					});
				}.bind(this));

				break;

			case 'random':

				var r = Math.floor(Math.random() * this.maximum) + 1;

				return new Promise(function (resolve, reject) {
					this.api(r).then(function (res) {
						resolve(res);
					});
				}.bind(this));

			default:

				return new Promise.resolve(['(shrug)']);

				break;

		}

	},

	api: function (key, alert) {

		var response = [];

		return new Promise(function (resolve, reject) {

			this._apiGetPokemon(key).then(function (pokemon) {

				this._apiGetInfo(pokemon).then(function (pokemon) {

					// console.log(pokemon);

					response.push(
						util.format('#%s: %s%s',
							pokemon['id'],
							pokemon['name'],
							(alert) ? ' @here' : ''
						)
					);

					// Figure out types
					var types = pokemon['types'];
					if (types.length > 0) {
						var typeStr = [];
						for (var i in types) {
							if (types.hasOwnProperty(i)) {
								if (typeof types[i].type != 'undefined') {
									if (typeof types[i].type != 'undefined') {
										typeStr.push(types[i].type.name);
									}
								}
							}
						}
						response.push('Type: ' + typeStr.join('/'));
					}

					response.push(pokemon['sprite']);

					resolve(response);

				}.bind(this), function (error) {

					response.push(error);

					return reject(response);

				}.bind(this));

			}.bind(this), function (error) {

				response.push(error);

				return reject(response);

			}.bind(this));

		}.bind(this));

	}
	,

	_apiGetPokemon: function (key) {

		var pokemon = {};
		var end = util.format(this.endpoint, key);

		return new Promise(function (resolve, reject) {

			request(end, function (error, response, body) {

				// console.log('requesting initial endpoint');

				if (error) {
					return reject(new Error(error));
				}

				if (response.statusCode !== 200) {
					return reject(new Error('bad status code'));
				}

				pokemon = JSON.parse(body);

				resolve(pokemon);

			});

		});

	}
	,

	_apiGetInfo: function (pokemon) {

		var species = {};
		var name = '';
		var sprite = '';

		var url = pokemon['species'].url;

		var sprites = pokemon['sprites'];
		if (sprites.front_default !== null) {
			sprite = sprites.front_default;
		} else {
			sprite = 'No sprite found =(';
		}

		return new Promise(function (resolve, reject) {

			request(url, function (error, response, body) {

				// console.log('requesting pokemon info');

				var res = {};

				if (error) {
					return reject(new Error(error));
				}

				if (response.statusCode !== 200) {
					return reject(new Error('bad status code'));
				}

				species = JSON.parse(body);

				var names = species['names'];

				for (var n in names) {
					if (names.hasOwnProperty(n)) {

						var lang = names[n];

						if (lang['language'].name === 'en') {
							name = lang['name'];
						}

					}
				}

				res = {
					id: pokemon['id'],
					name: name,
					sprite: sprite,
					types: pokemon['types']
				};

				// console.log(res);

				resolve(res);

			});

		});

	}

};
