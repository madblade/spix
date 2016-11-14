/**
 *
 */

'use strict';

App.Model.Client = function(app) {
    this.app = app;

    this.eventsToPush = [];
    this.activeControls = {};

    this.numberOfEvents = 0;
    this.maxNumberOfEventsPer16ms = 16;
};

App.Model.Client.prototype.init = function() {
    this.activeControls = this.getActiveControls();
};

App.Model.Client.prototype.refresh = function() {
    this.pushEvents();
};
