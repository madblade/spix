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

    start() {
        console.log("Application running.");
        this.jobId = setInterval(() => {
            console.log("Loop.");
        }, 200);
    }

    stop() {
        console.log("Application stopping.");
        if (this.jobId !== undefined) {
            clearInterval(this.jobId);
        }
    }

}

export default App;