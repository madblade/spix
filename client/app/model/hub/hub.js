/**
 *
 */

'use strict';

import extend       from '../../extend.js';

let Hub = function(app) {
    this.app = app;

    this.games = new Map();
};

extend(Hub.prototype, {

    update(data) {
        console.log('Hub fetched.');
        data = JSON.parse(data);

        let app = this.app;
        let map = this.games;

        // For all kinds.
        for (let property in data) {
            let games = data[property];
            let thisGames = map.get(property);

            if (!thisGames) {
                map.set(property, games);
            } else {
                for (let id = 0; id < games.length; ++id) {
                    let g = games[id];
                    if (thisGames.indexOf(g) < 0) thisGames.push(g);
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

export { Hub };
