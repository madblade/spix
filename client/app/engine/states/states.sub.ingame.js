/**
 *
 */

'use strict';

App.Engine.StateManager.prototype.startIngame = function() {

};

App.Engine.StateManager.prototype.endIngame = function() {
    return new Promise(function(resolve) {
       resolve();
    });
};
