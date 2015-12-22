var Hapi = require('hapi');
var joi = require('joi');
var http = require('https');
var Slack = require('slack-node');


var utils = require('./lib/utils');
var mail = require('./lib/mail')(require('./env.json'));


var server = new Hapi.Server();
server.connection({port: 3030});

var schemaUser = joi.object().keys({
    mail: joi.string().email().required()
});

var schemaFeedback = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
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
                /* mail.sendWelcomeMail(request.payload, function (err, data) {
                 if (err) server.log(['dove', 'register', 'Error'], 'Message sent with error: ' + err);
                 reply({message: 'thank you'});

                 });*/
                sendSlackNotification(request.payload);
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
    var slack = new Slack();

    slack.setWebhook('https://hooks.slack.com/services/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');

    if (!user.message) {
        // registering
        slackNotification = 'New user registered: Mail: ' + user.mail + '! Nummer: ' + utils.getCount();
    } else {
        // feedback
        slackNotification = 'New Feedback from ' + user.name + ' ' + user.mail + ': Subject: ' + user.subject + ', Message: ' + user.message;
    }

    slack.webhook({
        text: slackNotification
    }, function (err, response) {
        console.log(response);
    });

}
