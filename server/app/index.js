/**
 * Server app main logic.
 */

'use strict';

import Engine from './engine/';
import Connector from './connector';

class App {

    constructor() {
        this._engine = new Engine(this);
        this._connector = new Connector(this);
    }

    get engine() {
        return this._engine;
    }

    get connector() {
        return this._connector;
    }

    connect(socketio) {
        this._connector.configure(socketio);
    }
}

export default App;
