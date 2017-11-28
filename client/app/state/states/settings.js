/**
 *
 */

'use strict';

import extend from '../../extend.js';

let SettingsState = function(stateManager) {
    this.stateManager = stateManager;
    this.stateName = 'settings';
};

extend(SettingsState.prototype, {

    start() {
        this.app.engine.settings.run();
    },

    end() {
        return this.app.engine.settings.stop();
    }

});

export { SettingsState };
