/**
 * Processing and model transformations.
 */

'use strict';

import Hub from 'model/hub';

class Engine {

    constructor(app) {
        this._app = app;
        this._hub = new Hub();
    }

    addGame() {
        this._hub.addGame();
    }

}

export default Engine;
