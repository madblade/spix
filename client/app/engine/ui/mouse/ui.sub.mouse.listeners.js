/**
 *
 */

'use strict';

App.Engine.UI.prototype.registerMouseDown = function() {
    var scope = this;
    $(window).mousedown(function(event) {
        if (scope.app.stateManager.state !== 'ingame') return; // TODO menu state
        switch (event.which) {
            case scope.buttons.left:
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
    var rayCaster = this.app.graphicsEngine.raycaster;
    rayCaster.setFromCamera(new THREE.Vector2(0, 0), this.app.graphicsEngine.camera);
    var terrain = this.app.graphicsEngine.getCloseTerrain();
    return rayCaster.intersectObjects(terrain, true);
};

App.Engine.UI.prototype.onLeftMouseDown = function() {
    var ce = this.app.connectionEngine;

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
    var ce = this.app.connectionEngine;
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
