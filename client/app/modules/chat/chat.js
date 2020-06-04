/**
 *
 */

'use strict';

import extend           from '../../extend.js';

let Chat = function(register)
{
    this.register = register;
};

extend(Chat.prototype, {

    /**
     * Called whenever a game starts.
     * Init HTML elements here.
     */
    initModule()
    {
    },

    /**
     * Dispose of HTML elements here.
     * Called whenever a game stops.
     */
    disposeModule()
    {
    },

    /**
     * Called on socket 'chat' receive.
     */
    updateChat(data)
    {
        console.log(data);
    },

    /**
     * To call when a message has to be sent to the server.
     * @param message
     */
    sendMessage(message)
    {
        this.register.sendMessage('chat', message);
    }

});

export { Chat };
