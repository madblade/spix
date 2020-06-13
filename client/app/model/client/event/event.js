/**
 *
 */

'use strict';

import extend                   from '../../../extend.js';

import { TriggersModule }       from './event.triggers.js';
import { ActiveControlsModule } from './event.activecontrols.js';

let EventComponent = function(clientModel)
{
    this.clientModel = clientModel;

    this.eventsToPush = [];
    this.activeControls = {};
    this.numberOfEvents = 0;
    this.maxNumberOfEventsPer16ms = 16;
};

extend(EventComponent.prototype, {

    init()
    {
        // XXX [REFACTOR] put this in self model
        this.activeControls = this.getActiveControls();
    },

    triggerEvent(type, data)
    {
        switch (type)
        {
            case 'm':
                this.triggerMovement(type, data);
                break;
            case 'a':
                this.triggerAction(type, data);
                break;
            case 'r':
                this.triggerRotation(type, data);
                break;
            case 'u': // use item
                this.triggerUse(type, data);
                break;
            case 'ray': // Ray casted.
                this.triggerRayAction(type, data);
                break;
            default:
                break;
        }

        // Refresh, count transmitted items, if > threshold, stock them
        this.numberOfEvents++;
    },

    pushEvents()
    {
        let connectionEngine = this.clientModel.app.engine.connection;
        let events = this.eventsToPush;
        let currentEvent;

        let maxNumberOfEvents = this.maxNumberOfEventsPer16ms;
        if (this.numberOfEvents > maxNumberOfEvents) {
            this.filterEvents(); // Remove unnecessary events.
            console.log(`Calm down, user... ${this.numberOfEvents} unstacked events detected.`);
        }

        // Push to server
        // XXX [PERF] simplify and aggregate per client.
        for (let eventId = 0, length = events.length; eventId < length; ++eventId) {
            currentEvent = events[eventId];
            connectionEngine.send(currentEvent[0], currentEvent[1]);
        }

        // Flush
        this.eventsToPush = [];
        this.numberOfEvents = 0;
    },

    getEventsOfType(type)
    {
        let events = this.eventsToPush;
        let result = [];

        // N.B. prefer straight cache-friendly traversals
        for (let eventId = 0, length = events.length; eventId < length; ++eventId) {
            let currentEvent = events[eventId];

            if (currentEvent[0] === type) {
                result.push(currentEvent);
            }
        }

        return result;
    },

    filterEvents()
    {
        let events = this.eventsToPush;
        let filteredEvents = [];
        let lastRotation;

        // Remove all rotations except the last.
        for (let i = 0, l = events.length; i < l; ++i) {
            let currentEvent = events[i];
            if (!currentEvent) continue;
            if (currentEvent[0] !== 'r') {
                lastRotation = events[i];
            }
            else {
                filteredEvents.push(currentEvent);
            }
        }

        filteredEvents.push(lastRotation);
        this.eventsToPush = filteredEvents;
    }

});

extend(EventComponent.prototype, TriggersModule);
extend(EventComponent.prototype, ActiveControlsModule);

export { EventComponent };
