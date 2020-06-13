/**
 * @author alteredq / http://alteredqualia.com/
 */


import { Pass } from 'three/examples/jsm/postprocessing/Pass';
import { BoxBufferGeometry, Mesh, MeshBasicMaterial, Scene } from 'three';

let ShadowPass = function(
    scene, camera
)
{
    Pass.call(this);

    this.scene = scene;
    this.camera = camera;

    this.sceneShadows = new Scene();
    let cube = new Mesh(
        new BoxBufferGeometry(10, 10, 10),
        new MeshBasicMaterial()
    );
    cube.position.set(0, 0, 16);
    this.sceneShadows.add(cube);

    this.clear = true;
    this.needsSwap = false;
};

ShadowPass.prototype = Object.assign(Object.create(Pass.prototype), {

    constructor: ShadowPass,

    render: function(renderer, writeBuffer, readBuffer)
    {
        renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);

        let gl = renderer.getContext();
        let scene = this.scene;
        let camera = this.camera;
        let sceneShadows = this.sceneShadows;

        // Clears color, depth and stencil buffers
        renderer.clear();

        // Disable lights to draw ambient pass using .intensity = 0
        // instead of .visible = false to not force a slow shader
        // recomputation.
        // lights.forEach(function(l) {
        //     l.intensity = 0;
        // });

        // Render the scene with ambient lights only
        renderer.render(scene, camera);

        // Compute shadows into the stencil buffer.
        // Enable stencils
        gl.enable(gl.STENCIL_TEST);

        // Config the stencil buffer to test each fragment
        gl.stencilFunc(gl.ALWAYS, 1, 0xff);

        // Disable writes to depth buffer and color buffer
        // Only want to write to stencil
        gl.depthMask(false);
        gl.colorMask(false, false, false, false);

        // Begin depth fail algorithm for stencil updates

        // Cull front faces
        gl.cullFace(gl.FRONT);

        // Increment on depth fail (2nd param)
        gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP);

        // Render shadow volumes
        renderer.render(sceneShadows, camera);

        // Cull back faces
        gl.cullFace(gl.BACK);

        // Decrement on depth fail (2nd param)
        gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP);

        // Render shadow volumes again
        renderer.render(sceneShadows, camera);

        // Redraw against the stencil non-shadowed regions
        // Stencil buffer now reads 0 for non-shadow
        gl.stencilFunc(gl.EQUAL, 0, 0xff);

        // Don't update stencil buffer anymore
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

        // Re-enable writes to the depth and color buffers
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);

        // Re-enable lights for render
        // lights.forEach(function(l) {
        //     l.intensity = 1;
        // });

        // Render scene that's not in shadow with light calculations
        renderer.render(scene, camera);

        // Disable stencil test
        gl.disable(gl.STENCIL_TEST);

        // if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
        // renderer.render(this.scene, this.camera);
    }
});

export { ShadowPass };
