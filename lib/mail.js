
var mailgun = null;

var mailOptions = {};


function sendWelcomeMail(user, callback) {
    var data = {
        from: mailOptions.from,
        to: user.mail,
        subject: 'Howdy ' + user.name + '!',
        text: 'Danke für deine vertrauensvolle Freigabe deiner Daten, die wir für viel Geld an die russische Internetz-Mafia verhökern. Nein, Spaß!'
    };

    mailgun.messages().send(data, callback);

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