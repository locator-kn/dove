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
            request.log(['dove', 'register'], request.payload);
            request.payload.mail = request.payload.mail.toLowerCase();
            utils.addUser(request.payload).then(function () {
                mail.sendWelcomeMail(request.payload, function (err, data) {
                    if (err) server.log(['dove', 'register', 'Error'], 'Message sent with error: ' + err);
                    reply({message: 'thank you'});

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
            request.log(['dove', 'feedback'], request.payload);
            request.payload.mail = request.payload.mail.toLowerCase();
            reply(utils.addFeedback(request.payload));


            sendSlackNotification(request.payload);
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
            request.log(['dove', 'unsubscribe'], request.payload);
            utils.removeUser(request.params.mail.toLowerCase()).catch(function (err) {
                server.log(['dove', 'unsubscribe', 'Error'], 'Unsubscribe user failed' + request.params.mail + err);
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

var options = {
    reporters: [{
        reporter: require('good-console'),
        events: {log: '*', response: '*', error: '*', request: '*'}
        // config: '/var/log/locator/locator.log'
    }],
    requestHeaders: true,
    requestPayload: true,
    responsePayload: true
};

server.register({register: require('good'), options: options}, function (err) {

        if (err) console.error(['dove', 'Error'], 'starting logger' + err);
    }
);

server.start(function () {
    server.log(['dove', 'server'], 'Server running at:' + server.info.uri);
});

function sendSlackNotification(user) {
    var slackNotification = '';

    if (!user.message) {
        // registering
        slackNotification = 'New user registered: Name: ' + user.name + ', Mail: ' + user.mail + '! Nummer: ' + utils.getCount();
    } else {
        // feedback
        slackNotification = 'New Feedback from ' + user.name + ' ' + user.mail + ': Subject: ' + user.subject + ', Message: ' + user.message;
    }
    var headers = {
        'Content-Type': 'application/text',
        'Content-Length': slackNotification.length
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
            server.log(['dove', 'slack'], 'Response after sending slack notification: ' + responseString);
        });

    });

    request.on('error', function (e) {
        server.log(['dove', 'slack', 'Error'], 'Error while sending slackbot notification: ' + e)
    });

    request.write(slackNotification);
    request.end();


}
