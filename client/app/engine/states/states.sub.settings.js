/**
 *
 */

'use strict';

App.Engine.StateManager.prototype.startSettings = function() {
    this.app.uiEngine.stopKeyboardListeners();
    this.app.graphicsEngine.stop();

    var applicationSettings = {
        graphics: this.app.gameEngine.settings,
        gameplay: this.app.uiEngine.settings,
        sound: this.app.uiEngine.settings
    };

    var content = '';
    content += '<table class="table table-bordered" style="width:100%" class="noselect">';
    for (var setting in applicationSettings) {
        if (!applicationSettings.hasOwnProperty(setting)) continue;
        content += '<tr><td>' + setting + '</td><td>' + applicationSettings[setting] + '</td></tr>';
    }
    content += '</table>';

    // Add content then fade in.
    var settings = $("#announce");
    settings.addClass('settings').append(content).fadeIn();

    // Add listeners.
    $(document).keydown(function(event) {
        if (!event.keyCode) { return; }
        event.preventDefault();

        switch (event.keyCode) {
            case this.app.uiEngine.keyControls.escape:
                this.setState('ingame');
                break;
            default:
        }
    }.bind(this));
};

App.Engine.StateManager.prototype.endSettings = function() {
    var app = this.app;

    // Fade out settings menu.
    return new Promise(function(resolve) {
        var settings = $("#announce");
        settings.fadeOut(200, function() {
            settings.empty().removeClass('settings');

            app.graphicsEngine.animate();
            app.uiEngine.startKeyboardListeners();

            resolve();
        });
    });
};
