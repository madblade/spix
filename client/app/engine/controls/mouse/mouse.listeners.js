/**
 *
 */

'use strict';

App.Engine.UI.prototype.registerMouseDown = function() {
    var scope = this;
    $(window).mousedown(function(event) {
        if (scope.app.state.getState() !== 'ingame') return;
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

App.Engine.UI.prototype.rayCast = function() {
    var rayCaster = this.app.engine.graphics.raycaster;
    rayCaster.setFromCamera(new THREE.Vector2(0, 0), this.app.engine.graphics.camera);
    var terrain = this.app.engine.graphics.getCloseTerrain();
    return rayCaster.intersectObjects(terrain, true);
};

App.Engine.UI.prototype.onLeftMouseDown = function() {
    var ce = this.app.engine.connection;

    var intersects = this.rayCast();
    if (intersects.length <= 0) {
        console.log('Nothing intersected.');
        return;
    }
    intersects.sort(function(a,b) { return a.distance > b.distance; });
    var point = intersects[0].point;
    var newBlockType = 1; // TODO user selection for block type.
    ce.send('b', ['add', point.x, point.y, point.z, newBlockType]);
};

App.Engine.UI.prototype.onRightMouseDown = function() {
    var ce = this.app.engine.connection;
    var intersects = this.rayCast();
    if (intersects.length <= 0) {
        console.log('Nothing intersected.');
        return;
    }
    intersects.sort(function(a,b) { return a.distance > b.distance; });
    var point = intersects[0].point;
    ce.send('b', ['del', point.x, point.y, point.z]);
};

App.Engine.UI.prototype.onMiddleMouseDown = function() {
};

App.Engine.UI.prototype.unregisterMouseDown = function() {
    $(window).off('mousedown');
};
