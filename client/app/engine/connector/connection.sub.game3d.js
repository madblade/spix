/**
 *
 */

'use strict';

App.Engine.Connection.prototype.registerSocketForGame3D = function() {

    // TODO decouple
    this.addCustomListener('chk', this.app.model.server.updateChunks.bind(this.app.model.server));

    this.addCustomListener('ent', this.app.model.server.updateEntities.bind(this.app.model.server));

    this.addCustomListener('chat', this.app.modules.chat.updateChat.bind(this.app.modules.chat));

};
