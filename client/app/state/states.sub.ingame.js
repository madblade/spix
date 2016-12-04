/**
 *
 */

'use strict';

App.State.StateManager.prototype.register.push(function(scope) {
    scope.registerState('ingame', scope.startIngame, scope.endIngame);
});

App.State.StateManager.prototype.startIngame = function() {
    $('#announce').addClass('reticle-wrapper').append('<div class="reticle"></div>').show();
};

App.State.StateManager.prototype.endIngame = function() {
    app.engine.controls.stopListeners();

    return new Promise(function(resolve) {
        $('#announce').empty().removeClass('reticle-wrapper');
       resolve();
    });
};
