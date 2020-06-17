/**
 *
 */

'use strict';

import { ItemsModelModule } from '../../server/self/items';

let TriggersModule = {

    triggerUse(type, data)
    {
        let clientSelfModel = this.clientModel.selfComponent;
        let activeItemID = clientSelfModel.getCurrentItemID();
        if (!ItemsModelModule.isItemIDSupported(activeItemID))
        {
            console.error('[Client/Event] Item ID unsupported');
        }

        let events = this.eventsToPush;
        if (ItemsModelModule.isItemMelee(activeItemID)) {
            data.push('melee');
            data.push(activeItemID);
            events.push([type, data]);
        } else if (ItemsModelModule.isItemRanged(activeItemID)) {
            data.push('ranged');
            data.push(activeItemID);
            events.push([type, data]);
        }
    },

    triggerRayAction(type, data)
    {
        let clientSelfModel = this.clientModel.selfComponent;
        let activeItemID = clientSelfModel.getCurrentItemID();
        if (!ItemsModelModule.isItemIDSupported(activeItemID))
        {
            console.error('[Client/Event] Item ID unsupported');
            return;
        }

        if (ItemsModelModule.isItemBlock(activeItemID))
        {
            if (data[0] === 'add') {
                // From inventory, select block to be added.
                data.pop();
                data.splice(-3, 3);
                // There should be a server-wise check (if it is in the inventory)
                data.push(activeItemID);
            }
            this.triggerBlock('b', data);
        }
        else if (ItemsModelModule.isItemX(activeItemID))
        {
            let fx1 = data[1]; let fy1 = data[2]; let fz1 = data[3];
            let fx2 = data[4]; let fy2 = data[5]; let fz2 = data[6];
            let isOrangeOrBlue = ItemsModelModule.isItemX2(activeItemID);
            let isMainButton = data[7];
            data.pop();
            if (fx2 < fx1) { data[1] = fx2; data[4] = fx1; }
            if (fy2 < fy1) { data[2] = fy2; data[5] = fy1; }
            if (fz2 < fz1) { data[3] = fz2; data[6] = fz1; }
            data.push(clientSelfModel.getItemOffset());
            data.push(clientSelfModel.getAngleFromIntersectionPoint());
            data.push(isOrangeOrBlue);
            data.push(isMainButton);
            this.triggerBlock('x', data);
        }
        else if (ItemsModelModule.isItemNaught(activeItemID) && data[0] === 'del')
        {
            this.triggerBlock('b', data);
        }
        else
        {
            // XXX [GAMEPLAY] object, skill
            // Validate server-side? Keep duplicate in selfComponent?
            console.warn('[Client/Event] Unsupported item.');
        }
    },

    triggerMovement(type, data)
    {
        let ak = this.activeControls;
        let events = this.eventsToPush;
        let addEvent = function() { events.push([type, data]); };

        let sameTypeEvents = this.getEventsOfType(type);
        if (sameTypeEvents.length > 0) {
            // XXX [PERF] compress events
        }

        switch (data) {
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

            case 'run':
                if (!ak.run) addEvent();
                ak.run = true;
                break;
            case 'runx':
                if (ak.run) addEvent();
                ak.run = false;
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

            default: console.log('Unrecognized movement, could not trigger.');
                break;
        }
    },

    triggerAction(type, data)
    {
        let events = this.eventsToPush;

        switch (data) {
            case 'g':
                events.push([type, data]);
                break;
            default: console.log('Unrecognized action, could not trigger.');
                break;
        }
    },

    triggerRotation(type, data)
    {
        let events = this.eventsToPush;
        events.push([type, data]);
    },

    triggerBlock(type, data)
    {
        let events = this.eventsToPush;
        events.push([type, data]);
    },

};

export { TriggersModule };
