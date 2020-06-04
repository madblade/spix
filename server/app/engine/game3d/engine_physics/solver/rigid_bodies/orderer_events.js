/**
 *
 */

'use strict';

// import ObjectOrderer from './orderer_objects';

class EventOrderer
{
    static maxRange = 32.;

    constructor()
    {
        this._events = [];
        this._axes = new Map(); // World -> events.
    }

    get axes()      { return this._axes; }
    get events()    { return this._events; }

    addEvent(worldId, event)
    {
        // let p = event.position;
        // let x = p[0]; let y = p[1]; let z = p[2];
        let events = this._events;
        // let eventId = events.length;
        events.push(event);

        let worldAxes = this._axes.get(worldId);
        if (!worldAxes) {
            this._axes.set(worldId, [[0], [0], [0]]);
        }
        else {
            // let xAxis = worldAxes[0];
            // let yAxis = worldAxes[1];
            // let zAxis = worldAxes[2];

            // let dichotomyLowerBound = ObjectOrderer.dichotomyLowerBound;
            // let orderCache = ObjectOrderer.orderCache;
            // TODO [GAMEPLAY] add event
        }
    }

    // Automatically removes event when they are outdated.
    // If you wish to abort an event, simply set its lifespan to 0.
    // It will be destroyed at the next server iteration.
    applyEventsInWorld(worldId)
    {
        let axes = this._axes.get(worldId);
        let events = this._events;
        if (!axes) return;

        let toDelete = [];
        let xAxis = axes[0];
        let yAxis = axes[1];
        let zAxis = axes[2];
        let currentEvent;
        let eventIndex;

        // Detect deletable events.
        for (let i = 0, l = xAxis.length; i < l; ++i) {
            eventIndex = xAxis[i];
            currentEvent = events[eventIndex];
            currentEvent.apply();
            if (!currentEvent.isActive())
                toDelete.push(eventIndex);
        }

        // Shift all numbers...
        toDelete.sort();
        for (let i = 0, li = toDelete.length; i < li; ++i)
        {
            currentEvent = events[i];
            for (let j = currentEvent.indexX, lj = xAxis.length; j < lj; ++j)
                events[xAxis[j]].indexX -= 1;
            for (let j = currentEvent.indexY, lj = yAxis.length; j < lj; ++j)
                events[yAxis[j]].indexY -= 1;
            for (let j = currentEvent.indexZ, lj = zAxis.length; j < lj; ++j)
                events[zAxis[j]].indexZ -= 1;
        }

        // Delete from all arrays.
        for (let i = 0, li = toDelete.length; i < li; ++i)
        {
            eventIndex = toDelete[i];
            events.splice(eventIndex, 1);
            xAxis.splice(xAxis.indexOf(eventIndex), 1);
            yAxis.splice(yAxis.indexOf(eventIndex), 1);
            zAxis.splice(zAxis.indexOf(eventIndex), 1);
        }
    }
}

export default EventOrderer;
