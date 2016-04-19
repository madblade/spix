/**
 * Server app main logic.
 */

'use strict';

import Factory from './model/factory';

class App {

    constructor() {
        this._hub = Factory.createHub(this);
        this._connector = Factory.createConnector(this);
    }

    // Model
    get hub() { return this._hub; }
    get connector() { return this._connector; }

    connect(socketio) {
        this._connector.configure(socketio);
    }
}

export default App;
