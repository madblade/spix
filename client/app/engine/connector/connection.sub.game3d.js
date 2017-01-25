/**
 *
 */

'use strict';

extend(App.Engine.Connection.prototype, {

    registerSocketForGame3D: function() {

        var serverModel = this.app.model.server;
        var register = this.app.register;

        this.addCustomListener('chk', serverModel.updateChunks.bind(serverModel));
        this.addCustomListener('ent', serverModel.updateEntities.bind(serverModel));
        this.addCustomListener('x', serverModel.updateX.bind(serverModel));
        this.addCustomListener('chat', register.updateChat.bind(register));
    },

    unregisterSocketForGame3D: function() {
        this.removeCustomListener('chk');
        this.removeCustomListener('ent');
        this.removeCustomListener('x');
        this.removeCustomListener('chat');
    }

});
