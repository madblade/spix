/**
 * Client application entry point.
 */

'use strict';

// A wrapped class structure
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

    // State pattern manages in-game, loading, menus.
    // Also acts as a Mediator between engine, model(s) and modules
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
        'hub':          new App.Model.Hub(this),
        'server':       new App.Model.Server(this),
        'client':       new App.Model.Client(this)
    };

    // Modules can be registered to add custom behaviours
    this.modules = {
        'chat':         new App.Modules.Chat(this)
    };
};

App.Core.prototype.start = function() {

    this.state.setState('loading');

    this.engine.connection.setup();
};

// TODO register/reload modules
// TODO error reporting
// TODO wrapping DOM queries
