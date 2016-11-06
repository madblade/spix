/**
 *
 */

'use strict';

App.Modules.Chat = function(app) {
    this.app = app;
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
    // TODO decouple
    this.app.engine.connection.send('chat', message);
};
