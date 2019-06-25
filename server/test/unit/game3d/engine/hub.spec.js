/* eslint-disable */

import express          from 'express';
import App              from '../../../../app/app.js';
import http             from 'http';

describe('Hub API:', function () {

    let server;
    let httpServer;
    let io;
    let ioServer;
    let ioClient;

    let app;
    let client;

    let joined = false;

    before(function(done) {

        server = express();
        httpServer = http.createServer(server);
        io = require('socket.io');
        ioClient = require('socket.io-client');
        ioServer = io(httpServer, {
            serveClient: true,
            path: '/socket.io-client'
        });
        app = new App();
        app.connect(ioServer);

        let port = 9000;
        let ip = 'localhost';
        httpServer.listen(
            port, ip,
            function() {
                console.log('Express server listening on %s :: %d', ip, port);
                done();
            }
        );

        // return Table.removeAsync().then(function() {
        //     entity = new Table({
        //         field1: 'A',
        //         field2: 'B',
        //         field3: 'C',
        //     });
        //
        //     return entity.saveAsync();
        // });
    });

    describe('ioServer', function() {
        let succeeded = false;
        beforeEach(function(done) {
            client = ioClient("http://localhost:9000", {
                path: '/socket.io-client'});
            client.connect();
            succeeded = true;
            done();
        });

        it ('should be possible to connect to via ioClient', function() {
           succeeded.should.equal(true);
        });
    });

    describe('Client requesting for hub, new game and connection', function() {
        beforeEach(function (done) {
            client = ioClient("http://localhost:9000", {
                path: '/socket.io-client'
            });
            client.on('hub', function(data) {
                data = JSON.parse(data);
                let nbGames = 0;
                let firstGameId = 0;
                let gid = -1;
                for (let property in data) {
                    let games = data[property];
                    for (let id = 0; id < games.length; ++id) {
                        ++nbGames;
                        gid = games[id];
                        if (gid) {
                            firstGameId = gid;
                        }
                    }
                }

                if (nbGames < 1)
                    client.emit('util',
                        {request: 'createGame', gameType: 'game3d'});
                else {
                    client.emit('util',
                        {request:'joinGame', gameType: 'game3d', gameId: gid});
                }
            });
            client.on('joined', function() {
                joined = true;
                done();
            });
            client.emit('util', {request: 'hub'});
        });

        //     afterEach(function () {
        //         joined = false;
        //     });

        it('should have joined.', function () {
            joined.should.equal(true);
        });
    });

    // Clear DataBase after testing
    after(function(done) {
    //     return Table.removeAsync();
    //     process.exit();
        done();
     });
});
