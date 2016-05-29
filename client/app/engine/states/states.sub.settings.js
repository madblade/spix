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
            '<tr id="graphics"><td>Graphics</td></tr>' +
            '<tr id="gameplay"><td>Gameplay</td></tr>' +
            '<tr id="sound"><td>Sound</td></tr>' +
            '<tr id="return"><td>Return</td></tr>' +
            '</table>';
    };
    var graphicsHTML = function() {
        var settings = scope.app.graphicsEngine.settings;
        var content = '<table class="table table-bordered" style="width:100%" class="noselect">';
        for (var s in settings) {
            if (!settings.hasOwnProperty(s)) continue;
            content +='<tr><td>' + settings[s] + '</td></tr>';
        }
        content += '<tr id="return"><td>Return</td></tr>';
        content += '</table>';
        return content;
    };
    var gameplayHTML = function() {
        var settings = scope.app.uiEngine.settings;
        var content = '<table class="table table-bordered" style="width:100%" class="noselect">';

        if (settings.hasOwnProperty('language')) {
            var language =  '<select id="language" class="form-control">' +
                '<option value="en-US">en-US</option>' +
                '<option value="en-GB">en-GB</option>' +
                '<option value="fr">fr</option>' +
                '</select>';

            content +='<tr><td>Language</td>' + '<td>' + language + '</td></tr>';
        }

        content += '<tr id="return"><td colspan="2">Return</td></tr>';
        content += '</table>';

        return content;
    };
    var soundHTML = function() {
        var settings = scope.app.soundEngine.settings;
        var content = '<table class="table table-bordered" style="width:100%" class="noselect">';
        content += '<tr id="return"><td>Return</td></tr>';
        for (var s in settings) {
            if (!settings.hasOwnProperty(s)) continue;
            content +='<tr><td>' + settings[s] + '</td></tr>';
        }
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
        var l = $('#language');
        l.change(function() {
            var selected = l.find('option:selected').val();
            scope.app.uiEngine.changeLayout(selected);
            l.off('change');
        });
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
        $('#return').click(function() {
            $(document).off('keydown');
            unlistenHome();
            scope.setState('ingame');
            scope.app.uiEngine.requestPointerLock();

        }.bind(this));
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
