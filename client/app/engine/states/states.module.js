/**
 * A class managing states.
 */

'use strict';

App.Engine.StateManager = function(app) {
    // States
    this.app = app;
    this.previousState = '';
    this.state = '';

    // Register actions
    this.states = {
        loading: {start: this.startLoading, end: this.endLoading},
        hub: {start: this.startHub, end: this.endHub}

        // TODO other states
        //pregame: {start: , end: },
        //ingame: {start: , end: },
        //postgame: {start: , end: }
    };
};

App.Engine.StateManager.prototype.getState = function() {
    return this.state;
};

// Low-level setState must handle every kind of state modification
App.Engine.StateManager.prototype.setState = function(state) {
    this.previousState = this.state;
    this.state = state;

    if (this.states.hasOwnProperty(this.previousState)) {
        this.states[this.previousState].end();
    }

    if (this.states.hasOwnProperty(this.state)) {
        this.states[this.state].start();
    }
};
