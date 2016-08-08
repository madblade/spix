/**
 * A class managing states.
 */

'use strict';

App.Engine.StateManager = function(app) {
    this.app = app;

    // States
    this.previousState = '';
    this.state = '';

    // Register actions
    this.states = {};

    this.registerLoading();
    this.registerHub();
    this.registerIngame();
    this.registerSettings();
};

App.Engine.StateManager.prototype.registerState = function(stateId, start, end) {
    if (!this.states.hasOwnProperty(stateId)) {
        this.states[stateId] = {start: start.bind(this), end: end.bind(this)};
    }
};

App.Engine.StateManager.prototype.getState = function() {
    return this.state;
};

// Low-level setState must handle every kind of state modification
App.Engine.StateManager.prototype.setState = function(state, opt) {
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
