/**
 *
 */

'use strict';

App.Model.Client.EventComponent = function(clientModel) {
    this.clientModel = clientModel;

    this.eventsToPush = [];
    this.activeControls = {};
    this.numberOfEvents = 0;
    this.maxNumberOfEventsPer16ms = 16;
};

App.Model.Client.EventComponent.prototype.init = function() {
    this.activeControls = this.getActiveControls(); // TODO put in self model
};

App.Model.Client.EventComponent.prototype.triggerEvent = function(type, data) {
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
                // From inventory, select block to be added.
                data.push(serverSelfModel.getInventory().getItem(clientSelfModel.getCurrentItem()));
                this.triggerBlock('b', data);
            } else if (i.isX()) {
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
};

App.Model.Client.EventComponent.prototype.pushEvents = function() {
    var connectionEngine = this.clientModel.app.engine.connection;
    var events = this.eventsToPush;
    var currentEvent;

    var maxNumberOfEvents = this.maxNumberOfEventsPer16ms;
    if (this.numberOfEvents > maxNumberOfEvents ) {
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
};

App.Model.Client.EventComponent.prototype.getEventsOfType = function(type) {
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
};

App.Model.Client.EventComponent.prototype.filterEvents = function() {
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
};
