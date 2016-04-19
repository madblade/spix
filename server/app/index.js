/**
 * Server app main logic.
 */

'use strict';

import Hub from './model/hub';
import Connector from './connector';

class App {

    constructor() {
        this._hub = new Hub(this);
        this._connector = new Connector(this);
    }

    get hub() {
        return this._hub;
    }

    get connector() {
        return this._connector;
    }

    connect(socketio) {
        this._connector.configure(socketio);
    }
}

export default App;
