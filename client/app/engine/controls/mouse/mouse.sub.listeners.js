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

App.Engine.UI.prototype.rayCast = function() {
    var graphicsEngine = this.app.engine.graphics;

    var rayCaster = graphicsEngine.raycaster;
    var camera = graphicsEngine.camera;

    rayCaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    var terrain = graphicsEngine.getCloseTerrain();

    return rayCaster.intersectObjects(terrain, true);
};

App.Engine.UI.prototype.onLeftMouseDown = function() {
    var clientModel = this.app.model.client;

    var intersects = this.rayCast();
    if (intersects.length <= 0) {
        console.log('Nothing intersected.');
        return;
    }
    intersects.sort(function(a,b) { return a.distance > b.distance; });
    var point = intersects[0].point;
    var newBlockType = 1; // TODO user selection for block type.
    clientModel.triggerEvent('b', ['add', point.x, point.y, point.z, newBlockType]);
};

App.Engine.UI.prototype.onRightMouseDown = function() {
    var clientModel = this.app.model.client;

    var intersects = this.rayCast();
    if (intersects.length <= 0) {
        console.log('Nothing intersected.');
        return;
    }
    intersects.sort(function(a,b) { return a.distance > b.distance; });
    var point = intersects[0].point;
    clientModel.triggerEvent('b', ['del', point.x, point.y, point.z]);
};

App.Engine.UI.prototype.onMiddleMouseDown = function() {
};

App.Engine.UI.prototype.unregisterMouseDown = function() {
    $(window).off('mousedown');
};
