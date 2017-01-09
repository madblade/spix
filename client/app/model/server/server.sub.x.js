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

App.Model.Server.XModel.prototype.updateX = function(data) {
    console.log('### There is a new portal in range.');
    console.log(data);
    console.log('### /');
};
