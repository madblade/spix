/**
 * Manages whatever mechanism must remain client-side (like interaction settings),
 * along with aggregating, filtering and triggering events
 * to be sent.
 */

'use strict';

import extend               from '../../extend.js';

import { SelfComponent }    from './self/self.js';
import { EventComponent }   from './event/event.js';

var Client = function(app) {
    this.app = app;

    // Client model component.
    this.selfComponent = new SelfComponent(this);

    // Event component.
    this.eventComponent = new EventComponent(this);
};

extend(Client.prototype, {

    init: function() {
        this.selfComponent.init();
        this.eventComponent.init();
    },

    refresh: function() {
        this.selfComponent.processChanges();
        this.eventComponent.pushEvents();
    },

    pushForLaterUpdate: function(position) {
        this.selfComponent.triggerChange('camera-update', position);
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

export { Client };
