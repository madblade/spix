/**
 * Manages whatever mechanism must remain client-side (like interaction settings),
 * along with aggregating, filtering and triggering events
 * to be sent.
 */

'use strict';

App.Model.Client = function(app) {
    this.app = app;

    // Client model component.
    this.selfComponent = new App.Model.Client.SelfComponent(this);

    // Event component.
    this.eventComponent = new App.Model.Client.EventComponent(this);
};

App.Model.Client.prototype.init = function() {
    this.eventComponent.init();
};

App.Model.Client.prototype.refresh = function() {
    this.selfComponent.processChanges();
    this.eventComponent.pushEvents();
};

App.Model.Client.prototype.triggerEvent = function(type, data) {
    this.eventComponent.triggerEvent(type, data);
};

App.Model.Client.prototype.triggerChange = function(type, data) {
    this.selfComponent.triggerChange(type, data);
};

App.Model.Client.prototype.getCameraInteraction = function() {
    return this.selfComponent.cameraInteraction;
};
