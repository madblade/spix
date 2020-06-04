/**
 * Manages whatever mechanism must remain client-side (like interaction settings),
 * along with aggregating, filtering and triggering events
 * to be sent.
 */

'use strict';

import extend               from '../../extend.js';

import { SelfComponent }    from './self/self.js';
import { EventComponent }   from './event/event.js';

let Client = function(app)
{
    this.app = app;

    // Client model component.
    this.selfComponent = new SelfComponent(this);

    // Event component.
    this.eventComponent = new EventComponent(this);
};

extend(Client.prototype, {

    init()
    {
        this.selfComponent.init();
        this.eventComponent.init();
    },

    refresh()
    {
        this.selfComponent.processChanges();
        this.eventComponent.pushEvents();
    },

    pushForLaterUpdate(position)
    {
        this.selfComponent.triggerChange('camera-update', position);
    },

    triggerEvent(type, data)
    {
        this.eventComponent.triggerEvent(type, data);
    },

    triggerChange(type, data)
    {
        this.selfComponent.triggerChange(type, data);
    },

    /**
     * @deprecated
     */
    getCameraInteraction()
    {
        return this.selfComponent.cameraInteraction;
    },

    cleanupFullModel()
    {
        this.selfComponent.cleanup();
    }

});

export { Client };
