/**
 *
 */

'use strict';

App.State.StateManager.prototype.registerSettings = function() {
    this.registerState('settings', this.startSettings, this.endSettings);
};

App.State.StateManager.prototype.startSettings = function() {
    this.app.engine.settings.run();
};

App.State.StateManager.prototype.endSettings = function() {
    return this.app.engine.settings.stop();
};
