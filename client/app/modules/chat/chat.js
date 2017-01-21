/**
 *
 */

'use strict';

App.Modules.Chat = function(register) {
    this.register = register;
};

/**
 * Called on socket 'chat' receive.
 */
App.Modules.Chat.prototype.updateChat = function(data) {
    console.log(data);
};

/**
 * To call when a message has to be sent to the server.
 * @param message
 */
App.Modules.Chat.prototype.sendMessage = function(message) {
    this.register.sendMessage('chat', message);
};
