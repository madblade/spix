/**
 * --- ADAPTED FROM ---
 *
 * @author jbouny / https://github.com/jbouny
 *
 * Work based on :
 * @author Slayvin / http://slayvin.net : Flat mirror for three.js
 * @author Stemkoski / http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * @author Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

import {
    Color,
    FrontSide,
    LinearFilter,
    MathUtils,
    Matrix4,
    Mesh,
    PerspectiveCamera,
    Plane,
    RGBFormat,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector3,
    Vector4,
    WebGLRenderTarget
} from 'three';
import { ShadersModule } from '../shaders/shaders';

let Water = function(geometry, options)
{
    Mesh.call(this, geometry);

    let scope = this;
    options = options || {};

    let textureWidth = options.textureWidth !== undefined ? options.textureWidth : 512;
    let textureHeight = options.textureHeight !== undefined ? options.textureHeight : 512;

    let clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
    let alpha = options.alpha !== undefined ? options.alpha : 1.0;
    let time = options.time !== undefined ? options.time : 0.0;
    let normalSampler = options.waterNormals !== undefined ? options.waterNormals : null;
    // TODO wire in sun direction
    let sunDirection = options.sunDirection !== undefined ? options.sunDirection : new Vector3(0.70707, 0.70707, 0.0);
    let sunColor = new Color(options.sunColor !== undefined ? options.sunColor : 0xffffff);
    let waterColor = new Color(options.waterColor !== undefined ? options.waterColor : 0x7F7F7F);

    // TODO wire in eye
    let eye = options.eye !== undefined ? options.eye : new Vector3(0, 0, 0);
    let distortionScale = options.distortionScale !== undefined ? options.distortionScale : 20.0;
    let side = options.side !== undefined ? options.side : FrontSide;
    let fog = options.fog !== undefined ? options.fog : false;

    //

    let mirrorPlane = new Plane();
    let normal = new Vector3();
    let mirrorWorldPosition = new Vector3();
    let cameraWorldPosition = new Vector3();
    let rotationMatrix = new Matrix4();
    let lookAtPosition = new Vector3(0, 0, -1);
    let clipPlane = new Vector4();

    let view = new Vector3();
    let target = new Vector3();
    let q = new Vector4();

    let textureMatrix = new Matrix4();

    let mirrorCamera = new PerspectiveCamera();

    let parameters = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBFormat,
        stencilBuffer: false
    };

    let renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, parameters);

    if (!MathUtils.isPowerOfTwo(textureWidth) || !MathUtils.isPowerOfTwo(textureHeight))
        renderTarget.texture.generateMipmaps = false;

    let mirrorShader =
    {
        uniforms: UniformsUtils.merge([
            UniformsLib.fog,
            UniformsLib.lights,
            {
                normalSampler: { value: null },
                mirrorSampler: { value: null },
                alpha: { value: 1.0 },
                time: { value: 0.0 },
                size: { value: 1.0 },
                distortionScale: { value: 20.0 },
                textureMatrix: { value: new Matrix4() },
                sunColor: { value: new Color(0x7F7F7F) },
                sunDirection: { value: new Vector3(0.70707, 0.70707, 0) },
                eye: { value: new Vector3() },
                waterColor: { value: new Color(0x555555) }
            }
        ]),
        vertexShader: ShadersModule.getWaterVertexShader(),
        fragmentShader: ShadersModule.getWaterFragmentShader()
    };

    let material = new ShaderMaterial({
        fragmentShader: mirrorShader.fragmentShader,
        vertexShader: mirrorShader.vertexShader,
        uniforms: UniformsUtils.clone(mirrorShader.uniforms),
        lights: true,
        side,
        fog,
        //wireframe: true
    });

    material.uniforms.mirrorSampler.value = renderTarget.texture;
    material.uniforms.textureMatrix.value = textureMatrix;
    material.uniforms.alpha.value = alpha;
    material.uniforms.time.value = time;
    material.uniforms.normalSampler.value = normalSampler;
    material.uniforms.sunColor.value = sunColor;
    material.uniforms.waterColor.value = waterColor;
    material.uniforms.sunDirection.value = sunDirection;
    material.uniforms.distortionScale.value = distortionScale;

    material.uniforms.eye.value = eye;

    scope.material = material;

    scope.updateUniforms = function(lightPosition //, eyePosition
    ) {
        scope.material.uniforms.sunDirection.value.copy(lightPosition).normalize();
        // scope.material.uniforms.eye.value.copy(eyePosition).normalize();
    };

    scope.onBeforeRender = function(renderer, scene, camera)
    {
        mirrorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
        cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

        rotationMatrix.extractRotation(scope.matrixWorld);

        normal.set(0, 0, 1);
        normal.applyMatrix4(rotationMatrix);

        view.subVectors(mirrorWorldPosition, cameraWorldPosition);

        // Avoid rendering when mirror is facing away
        // if (view.dot(normal) > 0) return; // TODO adapt that for varying geometry.

        view.reflect(normal).negate();
        view.add(mirrorWorldPosition);

        rotationMatrix.extractRotation(camera.matrixWorld);

        lookAtPosition.set(0, 0, -1);
        lookAtPosition.applyMatrix4(rotationMatrix);
        lookAtPosition.add(cameraWorldPosition);

        target.subVectors(mirrorWorldPosition, lookAtPosition);
        target.reflect(normal).negate();
        target.add(mirrorWorldPosition);

        mirrorCamera.position.copy(view);
        mirrorCamera.up.set(0, 1, 0);
        mirrorCamera.up.applyMatrix4(rotationMatrix);
        mirrorCamera.up.reflect(normal);
        mirrorCamera.lookAt(target);

        mirrorCamera.far = camera.far; // Used in WebGLBackground

        mirrorCamera.updateMatrixWorld();
        mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);

        // Update the texture matrix
        textureMatrix.set(
            0.5, 0.0, 0.0, 0.5,
            0.0, 0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0
        );
        textureMatrix.multiply(mirrorCamera.projectionMatrix);
        textureMatrix.multiply(mirrorCamera.matrixWorldInverse);

        // TODO check need to do that for non planar mirrors
        // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
        // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
        mirrorPlane.setFromNormalAndCoplanarPoint(normal, mirrorWorldPosition);
        mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);

        clipPlane.set(mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant);

        let projectionMatrix = mirrorCamera.projectionMatrix;

        q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        q.z = -1.0;
        q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

        // Calculate the scaled plane vector
        clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

        // Replacing the third row of the projection matrix
        projectionMatrix.elements[2] = clipPlane.x;
        projectionMatrix.elements[6] = clipPlane.y;
        projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
        projectionMatrix.elements[14] = clipPlane.w;

        eye.setFromMatrixPosition(camera.matrixWorld);

        //

        let currentRenderTarget = renderer.getRenderTarget();

        let currentXrEnabled = renderer.xr.enabled;
        let currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

        scope.visible = false;

        renderer.xr.enabled = false; // Avoid camera modification and recursion
        renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

        renderer.setRenderTarget(renderTarget);
        if (renderer.autoClear === false) renderer.clear();
        renderer.render(scene, mirrorCamera);

        scope.visible = true;

        renderer.xr.enabled = currentXrEnabled;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

        renderer.setRenderTarget(currentRenderTarget);

        // Restore viewport

        let viewport = camera.viewport;

        if (viewport !== undefined) {
            renderer.state.viewport(viewport);
        }
    };
    // TODO render things in renderer manager.
    scope.onBeforeRender = function() {};
};

Water.prototype = Object.create(Mesh.prototype);
Water.prototype.constructor = Water;

export { Water };
