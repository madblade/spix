/**
 *
 */

'use strict';

App.Engine.StateManager.prototype.registerHub = function() {
    this.registerState('hub', this.startHub, this.endHub);
};

App.Engine.StateManager.prototype.startHub = function(data) {
    var content = '';
    content += '<table class="table table-bordered" style="width:100%" class="noselect">';

    for (var property in data) {
        var games = data[property];
        for (var id = 0; id < games.length; ++id) {
            content += '<tr><td>' + property + '</td><td>' + games[id] + '</td></tr>';
        }
    }
    content += '</table>';
    content += '<div><button class="btn btn-default game-creator" style="width:100%">' +
        'Request 3D game creation</button></div>';

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

    $('.game-creator').click(function() {
        application.connectionEngine.send('util', {request: 'createGame', gameType: 'game3d'});
        location.reload();
    });
};

App.Engine.StateManager.prototype.endHub = function () {
    // Remove jQuery listeners.
    $('tr').off('click');
    $('.game-creator').off('click');

    // Fade out hub announce.
    return new Promise(function(resolve) {
        var hub = $("#announce");
        hub.fadeOut(200, function() {
            hub.empty().removeClass('hub');
            resolve();
        });
    });
};
