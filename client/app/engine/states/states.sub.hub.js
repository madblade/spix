/**
 *
 */

'use strict';

App.Engine.StateManager.prototype.startHub = function(data) {
    var content = '<table style="width:100%" class="noselect">';

    for (var property in data) {
        if (!data.hasOwnProperty(property)) continue;
        var games = data[property];
        for (var id = 0; id < games.length; ++id) {
            content += '<tr><td>' + property + '</td><td>' + games[id] + '</td></tr>';
        }
    }
    content += '</table>';

    // Add content then fade in.
    var hub = $("#announce");
    hub.addClass('hub').append(content).fadeIn();

    // Add listeners.
    var application = this.app;
    $('tr').click(function() {
        var gameType = $(this).find('td:first').text();
        var gid = $(this).find('td:last').text();

        // Send a connection request.
        if (gameType === '' || gid === '') {
            console.log('Invalid data.');
            return;
        }

        application.join(gameType, gid);
    });
};

App.Engine.StateManager.prototype.endHub = function () {
    // Remove jQuery listeners.
    $('tr').off('click');

    // Fade out hub announce.
    return new Promise(function(resolve) {
        var hub = $("#announce");
        hub.fadeOut(200, function() {
            hub.empty().removeClass('hub');
            resolve();
        });
    });
};
