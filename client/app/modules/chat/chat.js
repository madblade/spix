/**
 *
 */

'use strict';

App.Modules.Chat = function(register) {
    this.register = register;
};

extend(App.Modules.Chat.prototype, {

    /**
     * Called on socket 'chat' receive.
     */
    updateChat: function(data) {
        console.log(data);
    },

    /**
     * To call when a message has to be sent to the server.
     * @param message
     */
    sendMessage: function(message) {
        this.register.sendMessage('chat', message);
    }

});
