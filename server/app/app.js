/**
 * Server app main logic.
 */

'use strict';

import Factory from './model/factory';

class App
{
    constructor()
    {
        this._hub = Factory.createHub(this);
        this._connection = Factory.createConnection(this);
    }

    // Model
    get hub() { return this._hub; }
    get connection() { return this._connection; }

    connect(socketio)
    {
        this._connection.configure(socketio);
    }

    connectRTC(userID, socket)
    {
        this._connection.configureFromSocket(socket, userID);
    }
}

export default App;
