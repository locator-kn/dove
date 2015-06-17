var Hapi = require('hapi');
var joi = require('joi');
var http = require('https');

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
            request.payload.mail = request.payload.mail.toLowerCase();
            utils.addUser(request.payload).then(function () {
                mail.sendWelcomeMail(request.payload, function (err, data) {
                    console.log(err, data);
                    reply({message: 'thank you'});
                    console.log('send slack')

                    sendSlackNotification(request.payload);
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
            request.payload.mail = request.payload.mail.toLowerCase();
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
            utils.removeUser(request.params.mail.toLowerCase()).catch(function (err) {
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

function sendSlackNotification(user) {

    var userString = 'New user registered: Name: ' + user.name + ', Mail: ' + user.mail;

    var headers = {
        'Content-Type': 'application/text',
        'Content-Length': userString.length
    };

    var options = {
        host: 'tripl.slack.com',
        path: '/services/hooks/slackbot?token=emIKR8MDCbIJU6w2XUbz8fG3&channel=%23tracking',
        method: 'POST',
        headers: headers
    };

    var request = http.request(options, function (res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            console.log('Response after sending slack notification: ', responseString);
        });

    });

    request.on('error', function (e) {
        console.log('Error while sending slackbot notification: ', e)
    });

    request.write(userString);
    request.end();


}
