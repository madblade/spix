/**
 *
 */

'use strict';

App.State.StateManager.prototype.registerIngame = function() {
    this.registerState('ingame', this.startIngame, this.endIngame);
};

App.State.StateManager.prototype.startIngame = function() {
    $('#announce').addClass('reticle-wrapper').append('<div class="reticle"></div>').show();
};

App.State.StateManager.prototype.endIngame = function() {
    app.engine.controls.stopKeyboardListeners();
    app.engine.controls.stopMouseListeners();

    return new Promise(function(resolve) {
        $('#announce').empty().removeClass('reticle-wrapper');
       resolve();
    });
};
