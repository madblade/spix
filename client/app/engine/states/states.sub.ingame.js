/**
 *
 */

'use strict';

App.Engine.StateManager.prototype.registerIngame = function() {
    this.registerState('ingame', this.startIngame, this.endIngame);
};

App.Engine.StateManager.prototype.startIngame = function() {

};

App.Engine.StateManager.prototype.endIngame = function() {
    return new Promise(function(resolve) {
       resolve();
    });
};
