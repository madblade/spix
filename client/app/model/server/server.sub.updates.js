/**
 *
 */

'use strict';

extend(App.Model.Server.prototype, {

    updateEntities: function(data) {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        this.selfModel.updateSelf(data[0], data[1]);
        this.entityModel.updateEntities(data[2]);
    },

    updateChunks: function(data) {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        this.chunkModel.updateChunks(data);
    },

    updateX: function(data) {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        this.xModel.updateX(data);
    }

});
