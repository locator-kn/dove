var Hapi = require('hapi');
var joi = require('joi');

var utils = require('./lib/utils');
var mail = require('./lib/mail')(require('./env.json'));


var server = new Hapi.Server();
server.connection({port: 3030});

var schemaUser = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
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
            utils.addUser(request.payload).then(function () {
                mail.sendWelcomeMail(request.payload, function (err, data) {
                    console.log(err, data);
                    reply({message: 'thank you'});
                });

            }).catch(reply);
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

server.route({
    method: 'GET',
    path: '/mail/unsubscribe/{mail}',
    config: {
        handler: function (request, reply) {
            utils.removeUser(request.params.mail).catch(function(err) {
                    console.log('Unsubscribe user failed', request.params.mail, err);
                return;
            });
            reply.redirect('http://project.locator-app.com/unsubscribe.html')
        },
        validate: {
            params: {
                mail: joi.string().email().required()
            }
        }
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});