var express = require("express");

class api {
	constructor(bot) {
		var self = this;
		self.bot = bot;
		self.port = 3000;
		if (self.bot.config.has('api') && self.bot.config.has('api.port')) {
			self.port = self.bot.config.get('api.port');
		}
		self.app = express();
		self.app.self = self;
	}

	init() {
		var self = this;
		self.bot.api = self;
		self.app.listen(self.port);
	}

	postInit() {
		var self = this;
		self.app.get("/user/list", self.getAllUsers);
		self.app.get("/user/count", self.getUserCount);
		self.app.get("/voiceInfo", self.getVoiceInfo);
	}

	respond(res, success, data, messages) {
		var response = {success: success};
		if (data) {
			response.data = data;
		}
		if (messages) {
			response.messages = messages;
		}
		res.send(response);
	}

	getVoiceInfo(req, res) {
		var self = req.app.self;
		if (!req.query.guildid) {
			return self.respond(res, 0, false, ["I require guildid to work"]);
		}
		var guild = self.bot.dclient.guilds.get(req.query.guildid);
		if (!guild) {
			return self.respond(res, 0, false, ["I could not find that guild"]);
		}
		var voicechannels = {};
		guild.channels.map(function(iter){
			if (iter.type != "voice") {
				return false;
			}
			voicechannels[iter.position] = {
				name: iter.name,
				memberCount: iter.members.size,
				members: iter.members.map(function(member) {
					return {
						name: member.displayName,
					};
				}),
			};
		});
		self.respond(res, 1, voicechannels);
	}

	getAllUsers(req, res) {
		var self = req.app.self;
		if (!req.query.guildid) {
			return self.respond(res, 0, false, ["I require guildid to work"]);
		}
		var guild = self.bot.dclient.guilds.get(req.query.guildid);
		if (!guild) {
			return self.respond(res, 0, false, ["I could not find that guild"]);
		}
		var users = [];
		guild.members.map(function(iter){
			users.push({
				id: iter.id,
				displayname: iter.displayName,
				username: iter.user.username + "#" + iter.user.discriminator,
			});
		});
		return self.respond(res, 1, users);
	}

	getUserCount(req, res) {
		var self = req.app.self;
		if (!req.query.guildid) {
			return self.respond(res, 0, false, ["I require guildid to work"]);
		}
		var guild = self.bot.dclient.guilds.get(req.query.guildid);
		if (!guild) {
			return self.respond(res, 0, false, ["I could not find that guild"]);
		}
		var users = {
			total: guild.members.size,
			online: guild.members.filter(function(iter) {
				return iter.presence.status == "online";
			}).size,
			dnd: guild.members.filter(function(iter) {
				return iter.presence.status == "dnd";
			}).size,
			idle: guild.members.filter(function(iter) {
				return iter.presence.status == "idle";
			}).size,
			inVoice: guild.members.filter(function(iter) {
				return iter.voiceSessionID != undefined;
			}).size,
		};
		return self.respond(res, 1, users);
	}

}

module.exports = api;
