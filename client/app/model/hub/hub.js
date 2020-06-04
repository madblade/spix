/**
 * Keeps track of active server games.
 */

'use strict';

import extend       from '../../extend.js';

let Hub = function(app)
{
    this.app = app;
    this.games = new Map();
};

extend(Hub.prototype, {

    update(data)
    {
        data = JSON.parse(data);

        let map = this.games;
        map.clear();

        // For all kinds.
        for (let property in data) {
            if (!data.hasOwnProperty(property)) continue;
            let games = data[property];
            map.set(property, games);
        }

        this.enterHub();
    },

    enterHub()
    {
        let app = this.app;
        let map = this.games;
        app.setState('hub', map);
    }

});

export { Hub };
