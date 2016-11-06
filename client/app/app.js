/**
 * Application entry point.
 */

'use strict';

var App = App || {
    'State': {},
    'Core': {},
    'Engine': {},
    'Model': {},
    'Modules': {}
};

App.Core = function() {

    this.state =        new App.State.StateManager(this);

    this.engine = {
        'connection':   new App.Engine.Connection(this),
        'graphics':     new App.Engine.Graphics(this),
        'audio':        new App.Engine.Audio(this),
        'controls':     new App.Engine.UI(this),
        'settings':     new App.Engine.Settings(this)
    };

    this.model = {
        'server':       new App.Model.Game(this)
    };

    this.modules = {
        'chat':         new App.Modules.Chat(this)
    };

    // Initialize states and set as loading.
    //this.stateManager = new App.State.StateManager(this);
    this.state.setState('loading');

    // Initialize modules
    //this.connectionEngine = new App.Engine.Connection(this);
    //this.graphicsEngine = new App.Engine.Graphics(this);
    //this.uiEngine = new App.Engine.UI(this);
    //this.audioEngine = new App.Engine.Audio(this);
    //
    //this.gameEngine = new App.Model.Game(this);
    //
    //this.chatEngine = new App.Modules.Chat(this);

    // Run application when connection is confirmed.
    this.connect().then(function() {this.run();}.bind(this));
};

// TODO register modules
// TODO reload modules
// TODO error reporting
// TODO wrapping DOM queries

