var Hapi = require('hapi');
var joi = require('joi');

var server = new Hapi.Server();
server.connection({port: 3030});

var schema = joi.object().keys({
    name: joi.string().alphanum().min(3).max(30).required(),
    mail: joi.string().email().required()
});


server.route({
    method: 'POST',
    path: '/register',
    config: {
        handler: function (request, reply) {
            reply('success');
        },
        validate: {
            payload: schema
        }
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});