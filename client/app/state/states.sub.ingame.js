/**
 *
 */

'use strict';

App.State.StateManager.prototype.register.push(function(scope) {
    scope.registerState('ingame', scope.startIngame, scope.endIngame);
});

extend(App.State.StateManager.prototype, {

    startIngame: function() {
        $('#announce').removeClass().empty().addClass('reticle-wrapper').append('<div class="reticle"></div>').center().show();
    },

    endIngame: function() {
        this.app.engine.controls.stopListeners();

        return new Promise(function(resolve) {
            $('#announce').empty().removeClass('reticle-wrapper');
            resolve();
        });
    }

});
