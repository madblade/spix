/**
 * A class managing states.
 */

'use strict';

import extend               from '../extend.js';

import { IngameState }      from './states/ingame.js';
import { LoadingState }     from './states/loading.js';
import { SettingsState }    from './states/settings.js';
import { HubState }         from './states/hub.js';

var StateManager = function(app) {
    this.app = app;

    // States
    this.states = {};
    this.previousState = '';
    this.state = '';
    this.focus = false;

    // Register actions
    this.registerState(new IngameState(this));
    this.registerState(new LoadingState(this));
    this.registerState(new SettingsState(this));
    this.registerState(new HubState(this));
};

StateManager.prototype.register = [];

// TODO [MEDIUM] refactor states strategy & dom handling
extend(StateManager.prototype, {

    registerState: function(state) {
        var stateId = state.stateName;
        var start = state.start;
        var  end = state.end;
        if (!this.states.hasOwnProperty(stateId)) {
            this.states[stateId] = {
                start: start.bind(this),
                end: end.bind(this)
            };
        }
    },

    // Low-level setState must handle every kind of state modification
    setState: function(state, opt) {
        this.previousState = this.state;
        this.state = state;

        if (!this.states.hasOwnProperty(this.state)) {
            console.log('The specified state does not exist.');
            return;
        }

        if (!this.states.hasOwnProperty(this.previousState)) {
            // Not defined at startup (for loading, that is)
            this.states[this.state].start(opt);
        } else {
            this.states[this.previousState].end().then(function() {
                this.states[this.state].start(opt);
            }.bind(this));
        }
    }

});

export { StateManager };
