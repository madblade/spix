/**
 *
 */

'use strict';

App.Engine.Connection.prototype.registerSocketForFlat3 = function() {

    this.addCustomListener('chk', this.app.gameEngine.updateChunks.bind(this.app.gameEngine));

    this.addCustomListener('ent', this.app.gameEngine.updateEntities.bind(this.app.gameEngine));

    this.addCustomListener('chat', this.app.chatEngine.updateChat.bind(this.app.chatEngine));

};
