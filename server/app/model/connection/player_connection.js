/**
 *
 */

'use strict';

import CollectionUtils from '../../engine/math/collections';

class PlayerConnection
{
    constructor(socket)
    {
        this._socket = socket;
        this._rooms = [];
        this._listeners = [];
        this._savedListeners = {};
    }

    get socket() { return this._socket; }
    set socket(newSocket)
    {
        this.dropListenersAndSave();
        this._socket = newSocket;
        this.resetListenersFromSave();
    }

    send(kind, data)
    {
        this._socket.emit(kind, data);
    }

    /**
     * Register custom socket behaviour.
     * @param message
     * @param behaviour
     */
    on(message, behaviour)
    {
        if (typeof behaviour !== 'function')
            console.log('WARN: invalid socket definition.');
        else {
            this._listeners.push(message);
            this._savedListeners[message] = behaviour;
            this._socket.on(message, behaviour);
        }
    }

    /**
     * Stop listening for a specific message.
     * @param message
     * @param behaviour the bound function
     */
    off(message, behaviour)
    {
        this._socket.off(message, behaviour);
        CollectionUtils.removeFromArray(this._listeners, message);
    }

    // Remove all listeners.
    offAll()
    {
        this._listeners.forEach(() => this._socket.removeAllListeners());
        this._listeners = [];
    }

    dropListenersAndSave()
    {
        this._listeners.forEach(message => this._socket.off(message, this._savedListeners[message]));
    }

    resetListenersFromSave()
    {
        this._listeners.forEach(message => this._socket.on(message, this._savedListeners[message]));
    }

    /**
     * Join a specific chan.
     * @param room
     */
    join(room)
    {
        // this._socket.join(room);
        this._rooms.push(room);
    }

    /**
     * Leave a specific chan.
     * @param room
     */
    leave(room)
    {
        // this._socket.leave(room);
        // Is there a reason for using rooms?
        CollectionUtils.removeFromArray(this._rooms, room);
    }

    // Leave all chans this player was connected to.
    leaveAll()
    {
        // this._rooms.forEach(room => this._socket.leave(room));
        this._rooms = [];
    }

    // Close connection: removes all listeners.
    close()
    {
        this.leaveAll();
        this.offAll();
    }

    // Make the object eligible for garbage collection.
    destroy()
    {
        this.close();
        delete this._socket;
        delete this._rooms;
        delete this._listeners;
    }
}

export default PlayerConnection;
