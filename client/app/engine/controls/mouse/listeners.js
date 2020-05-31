/**
 *
 */

'use strict';

import { $ }                from '../../../modules/polyfills/dom.js';
import { ItemsModelModule } from '../../../model/server/self/items';

let ListenerModule = {

    registerMouseDown() {
        let scope = this;
        let app = this.app;

        $(window).mousedown(function(event) {
            if (app.getState() !== 'ingame') return;
            switch (event.which) {
                case scope.buttons.left:
                    /*
                     There is a bug with some laptop touch pads that prevents the browser from triggering
                     the LEFT click when a 'keydown' event was fired in the near past (~200ms?).
                     In this case, it will be impossible to move and add a block at the same time with basic controls.
                     Everything works OK with the right and middle click (i.e. both on touch pads), so just
                     make the user reassign the 'left click' control key if he is in such a case.
                     */
                    scope.onLeftMouseDown();
                    break;
                case scope.buttons.middle:
                    scope.onMiddleMouseDown();
                    break;
                case scope.buttons.right:
                    scope.onRightMouseDown();
                    break;
                default:
            }
        });
    },

    getRaycastCoordinates()
    {
        let graphicsEngine = this.app.engine.graphics;

        // Perform intersection.
        let intersects = graphicsEngine.cameraManager.performRaycast();
        if (intersects.length <= 0) {
            console.log('[Listeners] Nothing intersected.');
            return;
        }

        intersects.sort(function(a, b) { return a.distance > b.distance; });
        let point = intersects[0].point;

        // Compute blocks.
        let flo = Math.floor;
        let abs = Math.abs;

        const rx = point.x; const ry = point.y; const rz = point.z;
        const dx = abs(abs(flo(rx)) - abs(rx));
        const dy = abs(abs(flo(ry)) - abs(ry));
        const dz = abs(abs(flo(rz)) - abs(rz));
        const ex = dx < 0.0000001; const ey = dy < 0.0000001; const ez = dz < 0.0000001;

        if (ex + ey + ez !== 1) {
            // TODO [HIGH] how do I remove an X?
            console.warn('[OnLeftMouse] Error: precision on intersection @addBlock');
            return;
        }

        return [ex, ey, ez, rx, ry, rz];
    },

    requestAddBlock()
    {
        let clientModel = this.app.model.client;
        let graphicsEngine = this.app.engine.graphics;

        let r = this.getRaycastCoordinates();
        if (!r) return;
        let [ex, ey, ez, rx, ry, rz] = r;

        let flo = Math.floor;
        let p = graphicsEngine.getCameraCoordinates();
        let px = p.x; let py = p.y; let pz = p.z;

        let fx1; let fy1; let fz1;
        let positiveIsFree = true; // direct + axis is empty
        if (ex) {
            positiveIsFree = px > rx;
            if (positiveIsFree) {
                fx1 = rx; fy1 = flo(ry); fz1 = flo(rz);
            } else if (px < rx) {
                fx1 = rx - 1; fy1 = flo(ry); fz1 = flo(rz);
            }
        } else if (ey) {
            positiveIsFree = py > ry;
            if (positiveIsFree) {
                fx1 = flo(rx); fy1 = ry; fz1 = flo(rz);
            } else if (py < ry) {
                fx1 = flo(rx); fy1 = ry - 1; fz1 = flo(rz);
            }
        } else if (ez) {
            positiveIsFree = pz > rz;
            if (positiveIsFree) {
                fx1 = flo(rx); fy1 = flo(ry); fz1 = rz;
            } else if (pz < rz) {
                fx1 = flo(rx); fy1 = flo(ry); fz1 = rz - 1;
            }
        }

        let fx2; let fy2; let fz2;
        let angle = 0;
        if (ex) {
            fx2 = positiveIsFree ? fx1 + 1 : fx1 - 1;
            fy2 = fy1;
            fz2 = fz1;
            angle = Math.atan2(fz2 + 0.5 - pz, fy2 + 0.5 - py);
        } else if (ey) {
            fx2 = fx1;
            fy2 = positiveIsFree ? fy1 + 1 : fy1 - 1;
            fz2 = fz1;
            angle = Math.atan2(fz2 + 0.5 - pz, fx2 + 0.5 - px);
        } else if (ez) {
            fx2 = fx1;
            fy2 = fy1;
            fz2 = positiveIsFree ? fz1 + 1 : fz1 - 1;
            angle = Math.atan2(fy2 + 0.5 - py, fx2 + 0.5 - px);
        }
        clientModel.selfComponent.setAngleFromIntersectionPoint(angle.toFixed(4));

        clientModel.triggerEvent('ray', ['add', fx1, fy1, fz1, fx2, fy2, fz2]);
    },

    requestDelBlock()
    {
        const clientModel = this.app.model.client;
        const graphicsEngine = this.app.engine.graphics;

        let r = this.getRaycastCoordinates();
        if (!r) return;
        let [ex, ey, ez, rx, ry, rz] = r;

        let flo = Math.floor;
        let p = graphicsEngine.getCameraCoordinates();
        let px = p.x; let py = p.y; let pz = p.z;

        let fx; let fy; let fz;
        if (ex) {
            if (px < rx) {
                fx = rx; fy = flo(ry); fz = flo(rz);
            } else if (px > rx) {
                fx = rx - 1; fy = flo(ry); fz = flo(rz);
            }
        } else if (ey) {
            if (py < ry) {
                fx = flo(rx); fy = ry; fz = flo(rz);
            } else if (py > ry) {
                fx = flo(rx); fy = ry - 1; fz = flo(rz);
            }
        } else if (ez) {
            if (pz < rz) {
                fx = flo(rx); fy = flo(ry); fz = rz;
            } else if (pz > rz) {
                fx = flo(rx); fy = flo(ry); fz = rz - 1;
            }
        }

        clientModel.triggerEvent('ray', ['del', fx, fy, fz]);
    },

    requestItemUse()
    {
        const clientModel = this.app.model.client;
        const graphicsEngine = this.app.engine.graphics;
        let p = graphicsEngine.getCameraCoordinates();
        let f = graphicsEngine.getCameraForwardVector();
        clientModel.triggerEvent('u', [p.x, p.y, p.z, f.x, f.y, f.z]);
    },

    requestMainHandItemAction() {
        let clientSelfModel = this.app.model.client.selfComponent;
        let activeItemID = clientSelfModel.getCurrentItemID();
        if (!ItemsModelModule.isItemIDSupported(activeItemID))
            console.warn('[Mouse/Listener] Item ID unsupported.');
        else if (ItemsModelModule.isItemUseable(activeItemID))
            this.requestItemUse();
        else if (ItemsModelModule.isItemPlaceable(activeItemID))
            this.requestAddBlock();
    },

    requestSecondaryHandItemAction() {
        this.requestDelBlock();
    },

    onLeftMouseDown() {
        this.requestMainHandItemAction();
    },

    onRightMouseDown() {
        this.requestSecondaryHandItemAction();
    },

    onMiddleMouseDown() {
    },

    mouseWheelCallback(event)
    {
        let clientModel = this.app.model.client;
        let ey = event.deltaY;
        // let df = event.deltaFactor;

        clientModel.triggerChange('interaction', ['itemSelect', ey]);
    },

    // TODO replace jquery-mousewheel with something better
    registerMouseWheel() {
        $(window).mousewheel(this.mouseWheelCallback.bind(this));
    },

    unregisterMouseDown() {
        $(window).off('mousedown');
    },

    unregisterMouseWheel() {
        $(window).off('mousewheel');
    }

};

export { ListenerModule };
