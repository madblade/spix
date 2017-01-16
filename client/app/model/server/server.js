/**
 * Contains game-specific data structures.
 */

'use strict';

App.Model.Server = function(app) {
    this.app = app;

    this.selfModel      = new App.Model.Server.SelfModel(app);
    this.chunkModel     = new App.Model.Server.ChunkModel(app);
    this.entityModel    = new App.Model.Server.EntityModel(app);
    this.xModel         = new App.Model.Server.XModel(app);

    this.isRunning = false;
};

App.Model.Server.prototype.init = function() {
    this.isRunning = true;
    this.selfModel.init();
    this.chunkModel.init();
    this.entityModel.init();
    this.xModel.init();
};

App.Model.Server.prototype.stop = function() {
    this.isRunning = false;
};

// Update graphics.
App.Model.Server.prototype.refresh = function() {
    this.selfModel.refresh();
    this.chunkModel.refresh();
    this.entityModel.refresh();
    this.xModel.refresh();
};
