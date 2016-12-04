/**
 *
 */

'use strict';

App.Engine.Settings.prototype.getHomeHTML = function() {
    return  '<table class="table table-bordered" style="width:100%" class="noselect">' +
    '<tr id="graphics"><td>Graphics</td></tr>' +
    '<tr id="gameplay"><td>Gameplay</td></tr>' +
    '<tr id="audio"><td>Audio</td></tr>' +
    '<tr id="return"><td>Return</td></tr>' +
    '</table>';
};

App.Engine.Settings.prototype.goHome = function() {

};

App.Engine.Settings.prototype.listenHome = function() {
    $('#graphics').click(function() { this.goGraphics(); }.bind(this));
    $('#gameplay').click(function() { this.goControls(); }.bind(this));
    $('#audio').click(function() { this.goAudio(); }.bind(this));
    $('#return').click(function() {
        $(document).off('keydown');
        this.unlistenHome();
        this.stateManager.setState('ingame');
        this.controlsEngine.requestPointerLock();
    }.bind(this));

    this.listeners.push('graphics', 'gameplay', 'audio', 'return');
};

App.Engine.Settings.prototype.unlistenHome = function() {
    $('#graphics').off('click');
    $('#gameplay').off('click');
    $('#audio').off('click');
};

App.Engine.Settings.prototype.listenReturn = function() {
    $('#return').click(function() {
        $('#return').off('click');
        $("#announce").empty().append(this.getHomeHTML());
        this.listenHome();
    }.bind(this));
};
