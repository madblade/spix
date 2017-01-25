/**
 *
 */

'use strict';

App.Model.Hub = function(app) {
    this.app = app;

    this.games = new Map();
};

extend(App.Model.Hub.prototype, {

    update: function(data) {
        console.log("Hub fetched.");
        data = JSON.parse(data);

        var app = this.app;
        var map = this.games;

        // For all kinds.
        for (var property in data) {
            var games = data[property];
            var thisGames = map.get(property);

            if (!thisGames) {
                map.set(property, games);
            } else {
                for (var id = 0; id < games.length; ++id) {
                    var g = games[id];
                    if (thisGames.indexOf(g)<0) thisGames.push(g);
                }
            }
        }

        if (app.isLoading()) {
            // Update state.
            app.setState('hub', map);

        } else if (app.getState() === 'hub') {
            // Bypass endHub.
            app.setState('hub', map);
        }
    }

});
