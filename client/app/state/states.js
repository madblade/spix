/**
 * A class managing states.
 */

'use strict';

App.State.StateManager = function(app) {
    this.app = app;

    // States
    this.states = {};
    this.previousState = '';
    this.state = '';
    this.focus = false;

    // Register actions
    this.register.forEach(function(f){f(this)}.bind(this));
};

App.State.StateManager.prototype.registerState = function(stateId, start, end) {
    if (!this.states.hasOwnProperty(stateId)) {
        this.states[stateId] = {start: start.bind(this), end: end.bind(this)};
    }
};

// Low-level setState must handle every kind of state modification
App.State.StateManager.prototype.setState = function(state, opt) {
    this.previousState = this.state;
    this.state = state;

    if (!this.states.hasOwnProperty(this.state)) {
        console.log("The specified state does not exist.");
        return;
    }

    if (!this.states.hasOwnProperty(this.previousState)) {
        // Not defined at startup (for loading, that is)
        this.states[this.state].start(opt);
    }

    else {
        this.states[this.previousState].end().then(function () {
            this.states[this.state].start(opt);
        }.bind(this));
    }
};

App.State.StateManager.prototype.register = [];
