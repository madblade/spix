/**
 *
 */

'use strict';

extend(App.Engine.UI.prototype, {

    registerMouseDown: function() {
        var scope = this;
        var app = this.app;

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

    onLeftMouseDown: function() {
        var clientModel = this.app.model.client;
        //var serverModel = this.app.model.server;
        var graphicsEngine = this.app.engine.graphics;

        // Perform intersection.
        var intersects = graphicsEngine.cameraManager.performRaycast();
        if (intersects.length <= 0) {
            console.log('Nothing intersected.');
            return;
        }
        intersects.sort(function(a,b) { return a.distance > b.distance; });
        var point = intersects[0].point;

        // Compute blocks.
        var flo = Math.floor;
        var abs = Math.abs;
        //var p1 = serverModel.getSelfModel().getSelfPosition();
        //var p2 = serverModel.getSelfModel().getHeadPosition();
        //var px = p1[0]+p2.x, py = p1[1]+p2.y, pz = p1[2]+p2.z;
        var p = graphicsEngine.getCameraCoordinates();
        var px = p.x, py = p.y, pz = p.z;
        
        var rx = point.x, ry = point.y, rz = point.z;
        var dx = abs(abs(flo(rx))-abs(rx)), dy = abs(abs(flo(ry))-abs(ry)), dz = abs(abs(flo(rz))-abs(rz));
        var ex = dx < 0.0000001, ey = dy < 0.0000001, ez = dz < 0.0000001;

        if (ex + ey + ez !== 1) {
            // TODO [HIGH] how do I remove an X?
            console.log("Error: precision on intersection @addBlock");
            return;
        }

        var fx1, fy1, fz1;
        var positiveIsFree = true; // direct + axis is empty
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

        var fx2, fy2, fz2;
        if (ex) {
            fx2 = positiveIsFree ? fx1+1 : fx1-1;
            fy2 = fy1;
            fz2 = fz1;
        } else if (ey) {
            fx2 = fx1;
            fy2 = positiveIsFree ? fy1+1 : fy1-1;
            fz2 = fz1;
        } else if (ez) {
            fx2 = fx1;
            fy2 = fy1;
            fz2 = positiveIsFree ? fz1+1 : fz1-1;
        }
        
        clientModel.triggerEvent('ray', ['add', fx1, fy1, fz1, fx2, fy2, fz2]);
    },

    onRightMouseDown: function() {
        var clientModel = this.app.model.client;
        var serverModel = this.app.model.server;
        var graphicsEngine = this.app.engine.graphics;

        var intersects = graphicsEngine.cameraManager.performRaycast();
        if (intersects.length <= 0) {
            console.log('Nothing intersected.');
            return;
        }
        intersects.sort(function(a,b) { return a.distance > b.distance; });
        var point = intersects[0].point;

        // Compute blocks.
        var flo = Math.floor;
        var abs = Math.abs;
        var p = graphicsEngine.getCameraCoordinates();
        var px = p.x, py = p.y, pz = p.z;

        var rx = point.x, ry = point.y, rz = point.z;
        var dx = abs(abs(flo(rx))-abs(rx)), dy = abs(abs(flo(ry))-abs(ry)), dz = abs(abs(flo(rz))-abs(rz));
        var ex = dx < 0.0000001, ey = dy < 0.0000001, ez = dz < 0.0000001;

        if (ex + ey + ez !== 1) {
            console.log("Error: precision on intersection @addBlock");
            return;
        }

        var fx, fy, fz;
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

    onMiddleMouseDown: function() {
    },
    
    registerMouseWheel: function() {
        var clientModel = this.app.model.client;
        
        $(window).mousewheel(function(event) {
            var ex = event.deltaX;
            var ey = event.deltaY;
            var df = event.deltaFactor;
            
            clientModel.triggerChange('interaction', ['item_offset', ey]);
        });
    },

    unregisterMouseDown: function() {
        $(window).off('mousedown');
    },

    unregisterMouseWheel: function() {
        $(window).off('mousewheel');
    }
    
});