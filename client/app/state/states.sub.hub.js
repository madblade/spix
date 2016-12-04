/**
 *
 */

'use strict';

App.State.StateManager.prototype.register.push(function(scope) {
    scope.registerState('hub', scope.startHub, scope.endHub);
});

App.State.StateManager.prototype.startHub = function(data) {
    var app = this.app;
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
    hub.empty().removeClass().addClass('hub').append(content).center().fadeIn();

    // Add listeners.
    $('tr').click(function() {
        var gameType = $(this).find('td:first').text();
        var gid = $(this).find('td:last').text();

        // Send a connection request.
        if (gameType === '' || gid === '') {
            console.log('Invalid data.');
            return;
        }

        app.join(gameType, gid);
    });

    $('.game-creator').click(function() {
        app.requestGameCreation('game3d');
    });
};

App.State.StateManager.prototype.endHub = function () {
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
