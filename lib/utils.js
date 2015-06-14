var fse = require('fs-extra');
var _ = require('lodash');


var file = './registeredUsers.json';
module.exports.addUser = function (user) {
    return new Promise(function (resolve, reject) {

        if (!user || !user.mail || !user.name) {
            return reject('missing user');
        }

        fse.ensureFile(file, function (err) {

            if (err) {
                return reject(err);
            }
            fse.readFile(file, 'utf-8', function (err, jsonObject) {

                if (err) {
                    return reject(err);
                }
                initFile(jsonObject).then(function (parsedFile) {
                    var exists = _.findWhere(parsedFile.data, {mail: user.mail});
                    if (exists) {
                        return reject({message: 'user already in list'});
                    }
                    parsedFile.count += 1;
                    parsedFile.data.push(user);
                    return updateData(parsedFile);
                })
                    .then(resolve)
                    .catch(reject);
            });
        });

    });
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
                return reject(err);
            }
            resolve(initData);
        });
    });
}

function updateData(newData) {
    return new Promise(function (resolve, reject) {

        fse.writeJson(file, newData, function (err) {
            if (err) {
                return reject(err);
            }
            resolve({message: 'success'});
        });
    });
}