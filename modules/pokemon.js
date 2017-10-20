const util = require('util');
const request = require('request');

module.exports = {

	special: [
		{
			'key': 'missingno',
			'response': 'manual',
			'manual': 'http://i.imgur.com/YyChnZM.gif'
		},
		{
			'key': 'pikablu',
			'response': 'api',
			'api': '183'
		}
	],

	endpoint: 'http://pokeapi.co/api/v2/pokemon/%s',

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
			response.push('`pokemon name/number` or `pokemon help` to get this message. Gen 6 or lower. Uses https://pokeapi.co');
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
			return this.api(msg);
		}

	},

	parseSpecial: function (special) {

		switch (special.response) {

			case 'manual':

				return Promise.resolve([special.manual]);

				break;

			case 'api':

				return new Promise(function (resolve, reject) {
					this.api(special.api).then(function (res) {
						resolve(res);
					});
				}.bind(this));

				break;

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

					response.push(
						util.format('#%s: %s%s',
							pokemon['id'],
							pokemon['name'],
							(alert) ? ' @here' : ''
						)
					);

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
					sprite: sprite
				};

				// console.log(res);

				resolve(res);

			});

		});

	}

}
;
