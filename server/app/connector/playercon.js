/**
 *
 */

'use strict';

class PlayerConnection {

    constructor(socket) {
        this._socket = socket;
    }

    send(kind, data) {
        this._socket.emit(kind, data);
    }
}

export default PlayerConnection;