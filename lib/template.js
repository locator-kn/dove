var _ = require('lodash');
var fse = require('fs-extra');

var welcomeTemplateFile = './templates/welcome/welcome.html';

function getWelcomeMail(user) {
    var rawTemplate = '';
    return new Promise(function (resolve, reject) {
        fse.readFile(welcomeTemplateFile, 'utf-8', function (err, templ) {
            if (err) {
                return reject(err);
            }
            console.log(templ);
        });
    });
}

module.exports.getWelcomeMail = getWelcomeMail;
