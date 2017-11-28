/**
 *
 */

'use strict';

import extend                   from '../../../extend.js';

import { TriggersModule }       from './event.triggers.js';
import { ActiveControlsModule } from './event.activecontrols.js';

var EventComponent = function(clientModel) {
    this.clientModel = clientModel;

    this.eventsToPush = [];
    this.activeControls = {};
    this.numberOfEvents = 0;
    this.maxNumberOfEventsPer16ms = 16;
};

extend(EventComponent.prototype, {

    init: function() {
        this.activeControls = this.getActiveControls(); // TODO put in self model
    },

    triggerEvent: function(type, data) {
        var clientSelfModel = this.clientModel.selfComponent;
        var serverSelfModel = this.clientModel.app.model.server.selfModel;

        switch (type) {
            case 'm':
                this.triggerMovement(type, data);
                break;
            case 'a':
                this.triggerAction(type, data);
                break;
            case 'r':
                this.triggerRotation(type, data);
                break;
            case 'ray': // Ray casted.
                var i = clientSelfModel.clickInteraction;
                if (i.isBlock()) {
                    if (data[0] == 'add') {
                        // From inventory, select block to be added.
                        data.splice(-3, 3);
                        data.push(serverSelfModel.getInventory().getItem(clientSelfModel.getCurrentItem()));
                    }
                    this.triggerBlock('b', data);
                } else if (i.isX()) {
                    var fx1 = data[1]; var fy1 = data[2]; var fz1 = data[3];
                    var fx2 = data[4]; var fy2 = data[5]; var fz2 = data[6];
                    if (fx2 < fx1) { data[1] = fx2; data[4] = fx1; }
                    if (fy2 < fy1) { data[2] = fy2; data[5] = fy1; }
                    if (fz2 < fz1) { data[3] = fz2; data[6] = fz1; }
                    data.push(clientSelfModel.getItemOffset());
                    data.push(clientSelfModel.getItemOrientation());
                    this.triggerBlock('x', data);
                } else {
                    // TODO [MEDIUM] object, skill...
                    // Validate server-side? Keep duplicate in selfComponent?
                }

                break;
            default:
                break;
        }

        // Refresh, count transmitted items, if > threshold, stock them
        this.numberOfEvents++;
    },

    pushEvents: function() {
        var connectionEngine = this.clientModel.app.engine.connection;
        var events = this.eventsToPush;
        var currentEvent;

        var maxNumberOfEvents = this.maxNumberOfEventsPer16ms;
        if (this.numberOfEvents > maxNumberOfEvents) {
            this.filterEvents(); // Remove unnecessary events.
            console.log('Calm down, user... ' + this.numberOfEvents);
        }

        // Push to server
        // TODO [PERF] simplify and aggregate per client.
        for (var eventId = 0, length = events.length; eventId < length; ++eventId) {
            currentEvent = events[eventId];
            connectionEngine.send(currentEvent[0], currentEvent[1]);
        }

        // Flush
        this.eventsToPush = [];
        this.numberOfEvents = 0;
    },

    getEventsOfType: function(type) {
        var events = this.eventsToPush;
        var result = [];

        // N.B. prefer straight cache-friendly traversals
        for (var eventId = 0, length = events.length; eventId < length; ++eventId) {
            var currentEvent = events[eventId];

            if (currentEvent[0] === type) {
                result.push(currentEvent);
            }
        }

        return result;
    },

    filterEvents: function() {
        var events = this.eventsToPush;
        var filteredEvents = [];
        var lastRotation;

        // Remove all rotations except the last.
        for (var i = 0, l = events.length; i < l; ++i) {
            var currentEvent = events[i];
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
