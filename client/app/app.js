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

// The road to wisdom? Well it's plain & simple to express
// Err and err and err again, but less and less and less - Piet Hein
App.Core = function() {

    // The Core is a Mediator between state, engine, model(s) and modules

    // State pattern manages in-game, loading, menus
    this.state =        new App.State.StateManager(this);

    // Engine manages client-side rendering, audio, inputs/outputs
    this.engine = {
        'connection':   new App.Engine.Connection(this),
        'graphics':     new App.Engine.Graphics(this),
        'audio':        new App.Engine.Audio(this),
        'controls':     new App.Engine.UI(this),
        'settings':     new App.Engine.Settings(this)
    };

    // Model buffers server and client objects
    this.model = {
        'server':       new App.Model.Server(this),
        'client':       new App.Model.Client(this)
    };

    // Modules can be registered to add custom behaviours
    this.modules = {
        'chat':         new App.Modules.Chat(this)
    };
};

App.Core.prototype.start = function() {
    // Run application when connection is confirmed.
    this.state.setState('loading');
    this.connect().then(function() {this.run();}.bind(this));

    return this;
};

// TODO register/reload modules
// TODO error reporting
// TODO wrapping DOM queries
