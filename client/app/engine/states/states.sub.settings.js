/**
 *
 */

'use strict';

App.Engine.StateManager.prototype.registerSettings = function() {
    this.registerState('settings', this.startSettings, this.endSettings);
};

App.Engine.StateManager.prototype.startSettings = function() {
    this.app.uiEngine.stopKeyboardListeners();
    this.app.graphicsEngine.stop();

    var scope = this;

    var homeHTML = function() {
        return '<table class="table table-bordered" style="width:100%" class="noselect">' +
            '<tr id="graphics"><td>graphics</td></tr>' +
            '<tr id="gameplay"><td>gameplay</td></tr>' +
            '<tr id="sound"><td>sound</td></tr>' +
            '</table>';
    };
    var graphicsHTML = function() {
        var content = '<table class="table table-bordered" style="width:100%" class="noselect">';
        content += '<tr id="return"><td>return</td></tr>';
        content += '</table>';
        return content;
    };
    var gameplayHTML = function() {
        var gameplaySettings = scope.app.uiEngine.settings;
        var content = '<table class="table table-bordered" style="width:100%" class="noselect">';
        for (var s in gameplaySettings) {
            if (!gameplaySettings.hasOwnProperty(s)) continue;
            content +='<tr id="graphics"><td>' + gameplaySettings[s] + '</td></tr>';
        }
        content += '<tr id="return"><td>return</td></tr>';
        content += '</table>';
        return content;
    };
    var soundHTML = function() {
        var content = '<table class="table table-bordered" style="width:100%" class="noselect">';
        content += '<tr id="return"><td>return</td></tr>';
        content += '</table>';
        return content;
    };

    var goGraphics = function() {
        unlistenHome();
        $("#announce").empty().append(graphicsHTML());
        listenReturn();
    };
    var goGameplay = function() {
        unlistenHome();
        $("#announce").empty().append(gameplayHTML());
        listenReturn();
    }.bind(this);
    var goSound = function() {
        unlistenHome();
        $("#announce").empty().append(soundHTML());
        listenReturn();
    };

    var listenReturn = function() {
        $('#return').click(function() {
            $('#return').off('click');
            var content = homeHTML();
            $("#announce").empty().append(content);
            listenHome();
        });
    };
    var listenHome = function() {
        $('#graphics').click(function() { goGraphics(); }.bind(this));
        $('#gameplay').click(function() { goGameplay(); }.bind(this));
        $('#sound').click(function() { goSound(); }.bind(this));
    };
    var unlistenHome = function() {
        $('#graphics').off('click');
        $('#gameplay').off('click');
        $('#sound').off('click');
    };

    // Add content then fade in.
    $("#announce").addClass('settings').append(homeHTML()).fadeIn();

    // Add listeners.
    listenHome();

    $(document).keydown(function(event) {
        if (!event.keyCode) {return;}
        event.preventDefault();
        if (event.keyCode === this.app.uiEngine.keyControls.escape) {
            $(document).off('keydown');
            unlistenHome();
            this.setState('ingame');
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
