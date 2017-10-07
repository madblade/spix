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

extend(App.Model.Client.prototype, {

    init: function() {
        this.selfComponent.init();
        this.eventComponent.init();
    },

    refresh: function() {
        this.selfComponent.processChanges();
        this.eventComponent.pushEvents();
    },

    pushForLaterUpdate: function() {
        this.selfComponent.triggerChange('camera-update', 'camera-update');
    },
    
    triggerEvent: function(type, data) {
        this.eventComponent.triggerEvent(type, data);
    },

    triggerChange: function(type, data) {
        this.selfComponent.triggerChange(type, data);
    },

    getCameraInteraction: function() {
        return this.selfComponent.cameraInteraction;
    }

});
