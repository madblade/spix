/**
 * Contains game-specific data structures.
 */

'use strict';

App.Model.Server = function(app) {
    this.app = app;

    this.selfModel      = new App.Model.Server.SelfModel(app);
    this.chunkModel     = new App.Model.Server.ChunkModel(app);
    this.entityModel    = new App.Model.Server.EntityModel(app);
    this.xModel         = new App.Model.Server.XModel(app, this.selfModel);
    this.selfModel.xModel = this.xModel;

    this.isRunning = false;
};

extend(App.Model.Server.prototype, {

    init: function() {
        this.isRunning = true;
        this.selfModel.init();
        this.chunkModel.init();
        this.entityModel.init();
        this.xModel.init();
    },

    stop: function() {
        this.isRunning = false;
    },

    // Update graphics.
    refresh: function() {
        this.selfModel.refresh();
        this.chunkModel.refresh();
        this.entityModel.refresh();
        this.xModel.refresh();
    }

});
