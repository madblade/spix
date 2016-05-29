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
    this.states = {
        loading: {start: this.startLoading.bind(this), end: this.endLoading.bind(this)},
        hub: {start: this.startHub.bind(this), end: this.endHub.bind(this)},
        ingame: {start: this.startIngame.bind(this), end: this.endIngame.bind(this)},
        settings: {start: this.startSettings.bind(this), end: this.endSettings.bind(this)},

        // TODO other states
        //pregame: {start: , end: },
        //postgame: {start: , end: }
    };
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
