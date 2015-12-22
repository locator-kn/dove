var fse = require('fs-extra');
var _ = require('lodash');
var boom = require('boom');

var file = '/home/newRegUser.json';
var feedbackFile = '/home/feedback.json';
var count;

module.exports.addUser = function (user) {
    return new Promise(function (resolve, reject) {

        if (!user || !user.mail) {
            return reject(boom.badRequest('missing user'));
        }

        fse.ensureFile(file, function (err) {

            if (err) {
                return reject(boom.badImplementation(err));
            }
            fse.readFile(file, 'utf-8', function (err, jsonObject) {

                if (err) {
                    return reject(boom.badImplementation(err));
                }
                initFile(jsonObject).then(function (parsedFile) {
                    var exists = _.findWhere(parsedFile.data, {mail: user.mail});
                    if (exists) {
                        return reject(boom.conflict('user already in list'));
                    }
                    parsedFile.count += 1;
                    count = parsedFile.count;
                    parsedFile.data.push(user);
                    return updateData(parsedFile);
                })
                    .then(resolve)
                    .catch(reject);
            });
        });

    });
};

module.exports.removeUser = function (mail) {
    return new Promise(function (resolve, reject) {

        if (!mail) {
            return reject(boom.badRequest('no mail provided'));
        }
        fse.ensureFile(file, function (err) {

            if (err) {
                return reject(boom.badImplementation(err));
            }
            fse.readFile(file, 'utf-8', function (err, jsonObject) {

                if (err) {
                    return reject(boom.badImplementation(err));
                }
                initFile(jsonObject).then(function (parsedFile) {
                    var index = _.findIndex(parsedFile.data, {mail: mail});
                    parsedFile.count -= 1;
                    parsedFile.data.splice(index, 1);
                    return updateData(parsedFile);
                })
                    .then(resolve)
                    .catch(reject);
            })

        })
    })
};

function initFile(jsonObject) {

    var initData = {
        count: 0,
        data: []
    };
    return new Promise(function (resolve, reject) {
        if (jsonObject && typeof jsonObject === 'string') {
            jsonObject = JSON.parse(jsonObject);
        }
        if (jsonObject && jsonObject.count) {
            return resolve(jsonObject);
        }
        fse.writeJson(file, initData, function (err) {
            if (err) {
                return reject(boom.badImplementation(err));
            }
            resolve(initData);
        });
    });
}

function updateData(newData) {
    return new Promise(function (resolve, reject) {

        fse.writeJson(file, newData, function (err) {
            if (err) {
                return reject(boom.badImplementation(err));
            }
            resolve({message: 'success'});
        });
    });
}

module.exports.addFeedback = function (feedback) {
    return new Promise(function (resolve, reject) {
        fse.readJSON(feedbackFile, function (err, feedbackExisting) {
            if (err) {
                return reject(boom.badRequest(err));
            }
            feedback.date = Date.now();
            feedbackExisting.push(feedback);
            fse.writeJson(feedbackFile, feedbackExisting, function (err) {
                if (err) {
                    return reject(boom.badImplementation(err));
                }
                return resolve({message: 'success'});
            });


        });
    });
};

module.exports.getCount = function() {
    return count;
};