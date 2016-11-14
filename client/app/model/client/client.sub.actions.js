/**
 *
 */

'use strict';

App.Model.Client.prototype.triggerMovement = function(type, data) {
    var ak = this.activeControls;
    var events = this.eventsToPush;
    var addEvent = function() { events.push([type, data]); };

    var sameTypeEvents = this.getEventsOfType(type);
    if (sameTypeEvents.length > 0) {
        // TODO compress events
    }

    switch(data) {
        case 'f':
            if (!ak.forward) addEvent();
            ak.forward = true;
            break;
        case 'r':
            if (!ak.right) addEvent();
            ak.right = true;
            break;
        case 'l':
            if (!ak.left) addEvent();
            ak.left = true;
            break;
        case 'b':
            if (!ak.backwards) addEvent();
            ak.backwards = true;
            break;
        case 'd':
            if (!ak.down) addEvent();
            ak.down = true;
            break;
        case 'u':
            if (!ak.up) addEvent();
            ak.up = true;
            break;

        case 'fx':
            ak.forward = false;
            addEvent();
            break;
        case 'rx':
            ak.right = false;
            addEvent();
            break;
        case 'lx':
            ak.left = false;
            addEvent();
            break;
        case 'bx':
            ak.backwards = false;
            addEvent();
            break;
        case 'dx':
            ak.down = false;
            addEvent();
            break;
        case 'ux':
            ak.up = false;
            addEvent();
            break;

        case 'xx':
            ak.forward = false;
            ak.backwards = false;
            ak.right = false;
            ak.left = false;
            addEvent();
            break;

        default: console.log('Unrecognized action, could not trigger.');
            break;
    }
};

App.Model.Client.prototype.triggerAction = function(type, data) {
    var events = this.eventsToPush;

    switch(data) {
        case 'g':
            events.push([type, data]);
            break;
        default: console.log('Unrecognized action, could not trigger.');
            break;
    }
};

App.Model.Client.prototype.triggerRotation = function(type, data) {
    var events = this.eventsToPush;
    events.push([type, data]);
};

App.Model.Client.prototype.triggerBlock = function(type, data) {
    var events = this.eventsToPush;
    events.push([type, data]);
};
