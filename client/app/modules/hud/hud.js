/**
 * Ingame user interface.
 */

'use strict';

App.Modules.Hud = function(register) {
    this.register = register;
};

App.Modules.Hud.prototype.updateSelfState = function(newState) {
    if (newState.hasOwnProperty('position')) {
        var f = Math.floor;
        var p = newState['position'];
        var text = f(p[0]) + ', ' + f(p[1]) + ', ' + f(p[2]);
        $("#hud").text(text).css('color', 'orange');
    }
};
