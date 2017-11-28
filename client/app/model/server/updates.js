/**
 *
 */

'use strict';

var UpdateModule = {

    updateMe: function(data) {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        var mainState = data[0];
        this.selfModel.updateSelf(mainState[0], mainState[1], mainState[2]);
    },

    updateEntities: function(data) {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        this.entityModel.updateEntities(data);
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

};

export { UpdateModule };
