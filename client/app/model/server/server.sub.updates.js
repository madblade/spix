/**
 *
 */

'use strict';

App.Model.Server.prototype.updateEntities = function(data) {
    if (!this.isRunning) return;
    data = JSON.parse(data);

    this.selfModel.updateSelf(data[0], data[1]);
    this.entityModel.updateEntities(data[2]);

    // TODO [CRIT] cleanup
    // this.app.engine.graphics.updateGraphicEntities(this.position, this.rotation, this.entities);
};

App.Model.Server.prototype.updateChunks = function(data) {
    if (!this.isRunning) return;
    // TODO check complexity
    // data = JSON.parse(data);
    this.chunkModel.updateChunks(data);

    // this.app.engine.graphics.updateGraphicChunks(data);
};
