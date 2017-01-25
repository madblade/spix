/**
 *
 */

'use strict';

App.State.StateManager.prototype.register.push(function(scope) {
    scope.registerState('settings', scope.startSettings, scope.endSettings);
});

extend(App.State.StateManager.prototype, {

    startSettings: function() {
        this.app.engine.settings.run();
    },

    endSettings: function() {
        return this.app.engine.settings.stop();
    }

});
