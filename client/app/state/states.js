/**
 * A class managing states.
 */

'use strict';

import extend               from '../extend.js';
import { $ }                from '../modules/polyfills/dom';

import { IngameState }      from './states/ingame.js';
import { LoadingState }     from './states/loading.js';
import { SettingsState }    from './states/settings.js';
import { HubState }         from './states/hub.js';
import { MainMenuState }    from './states/mainmenu';
import { PreIngameState }   from './states/pre.ingame';

let StateManager = function(app)
{
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
    this.registerState(new MainMenuState(this));
    this.registerState(new PreIngameState(this));
};

StateManager.prototype.register = [];

extend(StateManager.prototype, {

    registerState(state)
    {
        let stateId = state.stateName;
        if (!this.states.hasOwnProperty(stateId)) {
            this.states[stateId] = state;
        }
    },

    // Low-level setState must handle every kind of state modification
    setState(state, opt)
    {
        this.previousState = this.state;
        this.state = state;

        if (!this.states.hasOwnProperty(this.state)) {
            console.error(`[StateManager] State "${state}" does not exist.`);
            return;
        }

        if (!this.states.hasOwnProperty(this.previousState)) {
            // Not defined at startup (for loading, that is)
            this.states[this.state].start(opt);
        } else {
            this.states[this.previousState].end().then(function() {
                let s = this.states[this.state];
                let start = s.start.bind(s);
                start(opt);
            }.bind(this));
        }
    },

    cleanupDOM()
    {
        $('#announce').empty();
        $('#container').empty();
        // HUD
        $('#position').empty();
        $('#chat').empty();
        $('#network-graph').empty();
        $('#mini-map').empty();
        $('#items').empty();
        $('#hud').empty();
    }

});

export { StateManager };
