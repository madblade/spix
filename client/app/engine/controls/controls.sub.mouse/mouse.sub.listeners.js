/**
 *
 */

'use strict';

App.Engine.UI.prototype.registerMouseDown = function() {
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
};

App.Engine.UI.prototype.onLeftMouseDown = function() {
    var clientModel = this.app.model.client;
    var graphicsEngine = this.app.engine.graphics;

    // Perform intersection.
    var intersects = graphicsEngine.cameraManager.performRaycast();
    if (intersects.length <= 0) {
        console.log('Nothing intersected.');
        return;
    }
    intersects.sort(function(a,b) { return a.distance > b.distance; });
    var point = intersects[0].point;
    var newBlockType = 1; // TODO user selection for block type.

    // Compute blocks.
    var flo = Math.floor;
    var abs = Math.abs;
    var mainCamera = graphicsEngine.getCameraCoordinates();
    var px = mainCamera.x, py = mainCamera.y, pz = mainCamera.z;

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
            fx = rx - 1; fy = flo(ry); fz = flo(rz);
        } else if (px > rx) {
            fx = rx; fy = flo(ry); fz = flo(rz);
        }
    } else if (ey) {
        if (py < ry) {
            fx = flo(rx); fy = ry - 1; fz = flo(rz);
        } else if (py > ry) {
            fx = flo(rx); fy = ry; fz = flo(rz);
        }
    } else if (ez) {
        if (pz < rz) {
            fx = flo(rx); fy = flo(ry); fz = rz - 1;
        } else if (pz > rz) {
            fx = flo(rx); fy = flo(ry); fz = rz;
        }
    }

    clientModel.triggerEvent('b', ['add', fx, fy, fz, newBlockType]);
};

App.Engine.UI.prototype.onRightMouseDown = function() {
    var clientModel = this.app.model.client;
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
    var mainCamera = graphicsEngine.getCameraCoordinates();
    var px = mainCamera.x, py = mainCamera.y, pz = mainCamera.z;

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

    clientModel.triggerEvent('b', ['del', fx, fy, fz]);
};

App.Engine.UI.prototype.onMiddleMouseDown = function() {
};

App.Engine.UI.prototype.unregisterMouseDown = function() {
    $(window).off('mousedown');
};
