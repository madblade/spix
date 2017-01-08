/**
 * Manages whatever mechanism must remain client-side,
 * along with aggregating, filtering and triggering events
 * to be sent.
 */

'use strict';

App.Model.Client = function(app) {
    this.app = app;

    // Client model component.
    this.selfComponent = new App.Model.Client.SelfComponent(app);

    // Event component.
    this.eventComponent = new App.Model.Client.EventComponent(app);

};

App.Model.Client.prototype.init = function() {
    this.eventComponent.init();
};

App.Model.Client.prototype.refresh = function() {
    this.eventComponent.pushEvents();
};

App.Model.Client.prototype.triggerEvent = function(type, data) {
    this.eventComponent.triggerEvent(type, data);
};
