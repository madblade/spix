/**
 *
 */

'use strict';

import extend from '../../extend.js';

var SettingsState = function(stateManager) {
    this.stateManager = stateManager;
    this.stateName = 'settings';
};

extend(SettingsState.prototype, {

    start: function() {
        this.app.engine.settings.run();
    },

    end: function() {
        return this.app.engine.settings.stop();
    }

});

export { SettingsState };
