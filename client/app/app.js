/**
 * Client application entry point.
 */

'use strict';

// Utility function to extend a prototype.
// Useful when it spawns across multiple files.
function extend(prototype, functions) {
    if (typeof prototype !== 'object' || typeof functions !== 'object')
        throw Error('Could not extend ' + prototype + ' with ' + functions);

    for (var property in functions) {
        if (prototype.hasOwnProperty(property))
            throw Error('Tried to override existing property ' + property);

        if (functions.hasOwnProperty(property)) {
            var f = functions[property];
            if (typeof f !== 'function')
                throw Error('Could not extend prototype with ' + f);

            else
                prototype[property] = functions[property];
        }
    }
}

// Global application structure.
var App = App || {
    'State': {},
    'Core': {},
    'Engine': {},
    'Model': {},
    'Modules': {}
};

// Main entry point.
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
    this.register = new App.Modules.Register(this);
    this.register.registerDefaultModules();
};

extend(App.Core.prototype, {

    start: function() {
        this.setState('loading');
        this.engine.connection.connect();
    },

    stop: function() {
        this.setState('loading');
        this.engine.connection.disconnect();
        this.stopGame();
    }

});
