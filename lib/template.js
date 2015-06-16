var _ = require('lodash');
var fse = require('fs-extra');
var path = require('path');

var welcomeTemplateFile = path.resolve(__dirname, './../templates/welcome/welcome.html');

function getWelcomeMail(user) {
    var rawTemplate = '';
    return new Promise(function (resolve, reject) {
        fse.readFile(welcomeTemplateFile, 'utf-8', function (err, templ) {
            if (err) {
                return reject(err);
            }

            var compiled = _.template(templ);

            return resolve(console.log(compiled({
                'mail': user.mail,
                'name': user.name
            })));

        });
    });
}

module.exports.getWelcomeMail = getWelcomeMail;
