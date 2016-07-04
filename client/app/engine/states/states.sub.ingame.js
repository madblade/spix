/**
 *
 */

'use strict';

App.Engine.StateManager.prototype.registerIngame = function() {
    this.registerState('ingame', this.startIngame, this.endIngame);
};

App.Engine.StateManager.prototype.startIngame = function() {
    $('#announce').addClass('reticle-wrapper').append('<div class="reticle"></div>').show();
};

App.Engine.StateManager.prototype.endIngame = function() {
    return new Promise(function(resolve) {
        $('#announce').empty().removeClass('reticle-wrapper');
       resolve();
    });
};
