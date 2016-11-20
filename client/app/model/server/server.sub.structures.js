/**
 *
 */

'use strict';

App.Model.Server.StructureModel = function(app) {
    this.app = app;

    // Graphical component
    this.needsUpdate = false;
};

App.Model.Server.StructureModel.prototype.init = function() {};

App.Model.Server.StructureModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;
    var graphics = this.app.engine.graphics;
};
