/**
 *
 */

'use strict';

App.Engine.Chat = function(app) {
    this.app = app;
};

/**
 * Called on socket 'chat' receive.
 */
App.Engine.Chat.prototype.updateChat = function(data) {
    console.log(data);
};

/**
 * To call when a message has to be sent to the server.
 * @param message
 */
App.Engine.Chat.prototype.sendMessage = function(message) {
    this.app.connectionEngine.send('chat', message);
};
