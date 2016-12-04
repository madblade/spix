/**
 *
 */

'use strict';

App.Model.Hub = function(app) {
    this.app = app;
};

App.Model.Hub.prototype.update = function(data) {
    var app = this.app;
    console.log("Hub fetched.");

    if (app.isLoading)
        app.setState('hub', data);
};
