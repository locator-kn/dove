var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({port: 3030});


server.route({
    method: 'POST',
    path: '/register',
    handler: function (request, reply) {
        reply('success');
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});