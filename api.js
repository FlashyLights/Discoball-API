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
		self.app.get("/user/hasrole", self.userHasRole);
		self.app.get("/voiceInfo", self.getVoiceInfo);
		self.app.get("/user/byrole", self.getUsersByRole);
		self.app.get("/channel/send", self.sendMessageToChannel);
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

	getUsersByRole(req, res) {
		var self = req.app.self;
		if (!req.query.guildid) {
			return self.respond(res, 0, false, ["I require guildid to work"]);
		}
		var guild = self.bot.dclient.guilds.get(req.query.guildid);
		if (!guild) {
			return self.respond(res, 0, false, ["I could not find that guild"]);
		}
		var roles = {}
		guild.roles.map(function(role, id) {
			roles[role.name] = {
				online: 0,
				offline: 0,
			}
			role.members.map(function(member) {
				if (member.presence.status != "offline") {
					return roles[role.name].online++;
				}
				return roles[role.name].offline++;
			})
		})
		return self.respond(res, 1, roles);
	}

	sendMessageToChannel(req, res) {
		var self = req.app.self;
		if (!req.query.guildid) {
			return self.respond(res, 0, false, ["I require guildid to work"]);
		}
		if (!req.query.message) {
			return self.respond(res, 0, false, ["I require a message to work"]);
		}
		if (!req.query.target) {
			return self.respond(res, 0, false, ["I require a target to work"]);
		}
		var guild = self.bot.dclient.guilds.get(req.query.guildid);
		if (!guild) {
			return self.respond(res, 0, false, ["I could not find that guild"]);
		}
		var channel = guild.channels.find(function(chan) {
			return chan.name == req.query.target;
		});
		if (!channel) {
			return self.respond(res, 0, false, ["I could not find that channel"]);
		}
		channel.send(req.query.message).then(function(msg) {
			return self.respond(res, 1);
		});
	}

	userHasRole(req, res) {
		var self = req.app.self;
		if (!req.query.guildid) {
			return self.respond(res, 0, false, ["I require guildid to work"]);
		}
		if (!req.query.userid) {
			return self.respond(res, 0, false, ["I require a userid to work"]);
		}
		if (!req.query.rolename) {
			return self.respond(res, 0, false, ["I require a rolename to work"]);
		}
		var guild = self.bot.dclient.guilds.get(req.query.guildid);
		if (!guild) {
			return self.respond(res, 0, false, ["I could not find that guild"]);
		}
		var user = guild.members.find(function(member) {
			return member.user.id == req.query.userid;
		});
		if (!user) {
			return self.respond(res, 0, false, ["I could not find that user in that guild"]);
		}
		var role = user.roles.find(function(role) {
			console.log(role.name, req.query.rolename);
			return role.name.toLowerCase() == req.query.rolename.toLowerCase();
		});
		if (role) {
			return self.respond(res, 1);
		}
		return self.respond(res, 0);

	}

}

module.exports = api;
