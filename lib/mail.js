var mailgun = null;
var templ = require('./template');
var mailOptions = {};


function sendWelcomeMail(user, callback) {
    user.name = user.name.toLowerCase();
    templ.getWelcomeMail(user).then(function (mail) {

        var data = {
            from: mailOptions.from,
            to: user.mail,
            subject: 'Howdy ' + user.name + '!',
            html: mail
        };

        mailgun.messages().send(data, callback)

    }).catch(callback)


}


module.exports = function (env) {
    if (!env) {
        return new Error('env is required');
    }
    var mailgunEnv = env['mailgun'];
    mailOptions = mailgunEnv;

    // sender
    mailOptions.from = 'Locator Team <team@' + mailgunEnv.DOMAIN + '>';
    mailgun = require('mailgun-js')({apiKey: mailgunEnv.API_KEY, domain: mailgunEnv.DOMAIN});
    return {
        sendWelcomeMail: sendWelcomeMail
    };
};