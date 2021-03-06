/**
 * Client application entry point.
 */

'use strict';

import                  '../style/app.css';

import extend           from './extend.js';

// State
import { StateManager } from './state/states.js';

// Engine
import { Connection }   from './engine/connection/connection.js';
import { Graphics }     from './engine/graphics/graphics.js';
import { Audio }        from './engine/audio/audio.js';

import { UI }           from './engine/controls/controls.js';
import { Settings }     from './engine/settings/settings.js';

// Model
import { Hub }          from './model/hub/hub.js';
import { Server }       from './model/server/server.js';
import { Client }       from './model/client/client.js';
import { LocalServer }  from './model/localserver/localserver.js';

// Local Netcode
import { Standalone }   from './localserver/standalone';
import { Middleware }   from './localserver/middleware';

// Modules
import { Register }     from './modules/register/register.js';
// import { Polyfills }    from 'modules/polyfills/polyfills.js';

// Global application structure.
let App = App || {Core : {}};

// Main entry point.
App.Core = function()
{
    // State pattern manages in-game, loading, menus.
    // Also acts as a Mediator between engine, model(s) and modules
    this.state =      new StateManager(this);

    // Standalone server for solo mode (or local client)
    // Middleware for high latency discrepancy networks (non-LAN)
    this.localServer = {
        standalone:   new Standalone(this),
        middleware:   new Middleware(this)
    };

    // Engine manages client-side rendering, audio, inputs/outputs
    this.engine = {
        connection:   new Connection(this),
        graphics:     new Graphics(this),
        audio:        new Audio(this),
        controls:     new UI(this),
        settings:     new Settings(this)
    };

    // Model buffers server and client objects
    this.model = {
        hub:          new Hub(this),
        server:       new Server(this),
        client:       new Client(this),
        localServer:  new LocalServer(this)
    };

    // Modules can be registered to add custom behaviours
    this.register = new Register(this);
    this.register.registerDefaultModules();
};

// Application entry point.
extend(App.Core.prototype, {

    // The only intended way to play.
    startFromRemoteServer(socketAddress, port)
    {
        this.setState('loading');
        this.engine.connection.connectSocket(socketAddress, port, true); // connects
        this.engine.connection.listen(); // listens
    },

    startDemo()
    {
        this.setState('loading');
        let s = this.localServer.standalone.io.socketClient;
        this.engine.connection.setupLocalSocket(s);
        this.engine.connection.listenQuick(); // only listen to hub and join
        this.model.server.isDirty = true;
        this.localServer.standalone.start();
        this._forceRequestGameCreation('demo');
    },

    startFromLocalServer()
    {
        this.setState('loading');
        let s = this.localServer.standalone.io.socketClient;
        this.engine.connection.setupLocalSocket(s);
        this.engine.connection.listen();
        this.localServer.standalone.start();
    },

    startFromRemoteSandbox(socket)
    {
        this.setState('loading');
        this.engine.connection.setupLocalSocket(socket);
        this.engine.connection.listen();
        console.log('[App/Core] Awaiting remote sandbox answer...');
    },

    // Careful with what clients may execute in the local sandbox!
    clientConnectedToLocalSandbox(userID, socket)
    {
        this.localServer.standalone.connectUser(userID, socket);
    },

    start()
    {
        this.setState('loading');
        this.engine.graphics.preload().then(() =>
            this.setState('main')
        );
    },

    stop()
    {
        this.setState('loading');
        this.engine.connection.disconnect();
        this.stopGame();
    }

});

// Application utility.
extend(App.Core.prototype, {

    getState()
    {
        return this.state.state;
    },

    setState(state, opt)
    {
        this.state.setState(state, opt);
    },

    isLoading()
    {
        return this.getState() === 'loading';
    },

    isFocused()
    {
        return this.state.focus;
    },

    setFocused(isFocused)
    {
        // Ensure output type.
        this.state.focus = !!isFocused;
    },

    // Called when the socket is connected.
    connectionEstablished()
    {
        console.log('Connected.');

        setTimeout(
            function() {
                this.engine.connection.requestHubState();
            }.bind(this),
            1500
        );
    },

    // Called when a 'creation' request is emitted from Hub state.
    requestGameCreation(gameType, options)
    {
        if (this.getState() !== 'hub') {
            console.error('Could not request game creation outside of Hub.');
            return;
        }

        this.engine.connection.requestGameCreation(gameType, options);
    },

    _forceRequestGameCreation(gameType, options)
    {
        this.engine.connection.requestGameCreation(gameType, options);
    },

    _forceJoin(gameType, gameId)
    {
        this.setState('preingame');
        this.engine.connection.configureGame(gameType, gameId);
        this.model.client.init(gameType);
        this.model.server.init(gameType);
        this.engine.connection.join(gameType, gameId);
    },

    // Called when a 'join' request is emitted from Hub state.
    join(gameType, gameId)
    {
        if (this.getState() !== 'hub')
            throw Error('Could not request game joining outside of Hub.');

        console.log('Join request...');

        // Configuration.
        this.setState('preingame');
        this.engine.connection.configureGame(gameType, gameId);

        // Start model loop.
        this.model.client.init(gameType);
        this.model.server.init(gameType);
        console.log('Game effectively started.');

        // Try to join specified game.
        this.engine.connection.join(gameType, gameId);
    },

    // Run game when joining confirmed.
    joinedServer()
    {
        console.log('[Game/Client] Joined server.');

        // Run game
        this.runGame();
    },

    runGame()
    {
        this.engine.graphics.run();
        this.engine.controls.run();
        this.engine.audio.run();
        this.register.gameStarted();
    },

    stopGame()
    {
        this.register.gameStopped();
        this.engine.connection.unregisterSocketForGame3D();
        this.engine.graphics.stop();
        this.engine.controls.stop();
        this.engine.audio.stop();
        this.model.server.cleanupFullModel();
        this.model.client.cleanupFullModel();
        this.engine.graphics.cleanupFullGraphics();
        this.state.cleanupDOM();
    },

});

// Modules, for extending the core functionality.
// To be done:
// [MOD] register/reload modules
// [MOD] error reporting
// [MOD] wrapping DOM queries
extend(App.Core.prototype, {

    registerModule()
    {

    },

    restartModule()
    {

    }
});

window.register = (function()
{
    let app = new App.Core();
    app.start();
    return app.register;
}());
