/**
 *
 */

'use strict';

class PlayerConnection {

    constructor(socket) {
        this._socket = socket;
        this._rooms = [];
    }

    send(kind, data) {
        this._socket.emit(kind, data);
    }

    join(room) {
        this._socket.join(room);
        this._rooms.push(room);
    }

    leave(room) {
        this._socket.leave(room);
        var roomId = this._rooms.indexOf(room);
        if (roomId > -1) this._rooms.splice(roomId, 1);
    }

    leaveAll() {
        this._rooms.forEach((room) => this._socket.leave(room));
    }
}

export default PlayerConnection;