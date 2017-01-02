/**
 *
 */

'use strict';

App.Model.Server.XModel = function(app) {
    this.app = app;

    // Graphical component
    this.needsUpdate = false;
};

App.Model.Server.XModel.prototype.init = function() {};

App.Model.Server.XModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;
    var graphics = this.app.engine.graphics;
};
