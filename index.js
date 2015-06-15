var Hapi = require('hapi');
var joi = require('joi');

var utils = require('./lib/utils');


var server = new Hapi.Server();
server.connection({port: 3030});

var schemaUser = joi.object().keys({
    name: joi.string().alphanum().min(3).max(30).required(),
    mail: joi.string().email().required()
});

var schemaFeedback = joi.object().keys({
    name: joi.string().alphanum().min(3).max(30).required(),
    mail: joi.string().email().required(),
    subject: joi.string().required(),
    message: joi.string().required()
});


server.route({
    method: 'POST',
    path: '/mail/register',
    config: {
        handler: function (request, reply) {
            reply(utils.addUser(request.payload));
        },
        validate: {
            payload: schemaUser
        }
    }
});

server.route({
    method: 'POST',
    path: '/mail/feedback',
    config: {
        handler: function (request, reply) {
            reply(utils.addFeedback(request.payload));
        },
        validate: {
            payload: schemaFeedback
        }
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});