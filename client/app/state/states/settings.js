/**
 *
 */

'use strict';

import extend from '../../extend.js';

let SettingsState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'settings';
};

extend(SettingsState.prototype, {

    start()
    {
        this.stateManager.app.engine.settings.run();
    },

    end()
    {
        return this.stateManager.app.engine.settings.stop();
    }

});

export { SettingsState };
