/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.update = function(c, b, e) {

    //console.log("position: " + c);
    //console.log("blocks: " + b);
    //console.log("entities: " + e);

    if (c !== undefined) {
        this.avatar.position.x = c[0];
        this.avatar.position.z = -c[1];
        this.avatar.position.y = c[2];

        var yaw = this.controls;
        yaw.position.x = c[0];
        yaw.position.z = -c[1] + 10;
        yaw.position.y = 5;

        //this.camera.position.x = c[0];
        //this.camera.position.y = c[1];
    }
    // this.scene.add();
    // Compare b with this.blocks.
};
