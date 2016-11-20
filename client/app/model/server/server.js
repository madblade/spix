/**
 * Contains game-specific data structures.
 */

'use strict';

App.Model.Server = function(app) {
    this.app = app;

    this.worldModel =       new App.Model.Server.WorldModel(app);
    this.selfModel =        new App.Model.Server.SelfModel(app);
    this.chunkModel =       new App.Model.Server.ChunkModel(app);
    this.entityModel =      new App.Model.Server.EntityModel(app);
    this.structureModel =   new App.Model.Server.StructureModel(app);

    this.isRunning = false;
};

App.Model.Server.prototype.init = function() {
    this.isRunning = true;
    this.worldModel.init();
    this.selfModel.init();
    this.chunkModel.init();
    this.entityModel.init();
    this.structureModel.init();
};

App.Model.Server.prototype.stop = function() {
    this.isRunning = false;
};

// Update graphics.
App.Model.Server.prototype.refresh = function() {
    this.worldModel.refresh();
    this.selfModel.refresh();
    this.chunkModel.refresh();
    this.entityModel.refresh();
    this.structureModel.refresh();
};
