/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.update = function(cp, cr, b, e) {

    //console.log("position: " + c);
    //console.log("blocks: " + b);
    //console.log("entities: " + e);

    for (var eid in e) {
        if (!e.hasOwnProperty(eid)) continue;
        console.log(e[eid]);
    }

    if (cp !== undefined) {
        this.avatar.position.x = cp[0];
        this.avatar.position.z = -cp[1];
        this.avatar.position.y = cp[2];

        this.avatar.rotation.x = cr[0];
        this.avatar.rotation.y = cr[1];

        var camera = this.controls; // Camera wrapper actually
        this.positionCameraBehind(camera, cp);

        //this.camera.position.x = c[0];
        //this.camera.position.y = c[1];
    }
    // this.scene.add();
    // Compare b with this.blocks.
};

App.Engine.Graphics.prototype.positionCameraBehind = function(cameraWrapper, vector) {
    cameraWrapper.position.x = vector[0];
    cameraWrapper.position.z = -vector[1] + 10;
    cameraWrapper.position.y = vector[2] + 5;
};
