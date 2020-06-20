import {
    LinearFilter,
    Matrix4, Object3D, PerspectiveCamera, Plane,
    RGBFormat, Vector3, Vector4, WebGLRenderTarget
} from 'three';

let WaterCameraModule = {

    createWaterCamera()
    {
        let fov = this.mainFOV;
        let aspect = this.mainAspect;
        let near = this.mainNear;
        let far = this.mainFar;
        let waterRenderTarget = new WebGLRenderTarget(512, 512, {
            minFilter: LinearFilter, magFilter: LinearFilter,
            format: RGBFormat
        });

        let waterCamObject = new PerspectiveCamera(fov, aspect, near, far);
        return {
            camera: waterCamObject,
            waterRenderTarget,
            mirrorPlane: new Plane(),
            normal: new Vector3(),
            mirrorWorldPosition: new Vector3(),
            cameraWorldPosition: new Vector3(),
            rotationMatrix: new Matrix4(),
            lookAtPosition: new Vector3(0, 0, -1),
            clipPlane: new Vector4(),
            view: new Vector3(),
            target: new Vector3(),
            q: new Vector4(),
            textureMatrix: new Matrix4(),
            clipBias: 0.01,
            eye: new Vector3(0, 0, 0)
            // waterCameraHelper: new CameraHelper(this.waterCamera)
        };
    },

    // Set from mirror and clip oblique
    updateWaterCamera(camera)
    {
        let waterCamera = this.waterCamera;
        if (!waterCamera) return;

        // let camera = this.mainCamera.cameraObject;
        let mirrorCamera = waterCamera.camera;

        let clipBias = waterCamera.clipBias;
        let mirrorPlane = waterCamera.mirrorPlane;
        let normal = waterCamera.normal;
        let mirrorWorldPosition = waterCamera.mirrorWorldPosition;
        let cameraWorldPosition = waterCamera.cameraWorldPosition;
        let lookAtPosition = waterCamera.lookAtPosition;
        let clipPlane = waterCamera.clipPlane;
        let view = waterCamera.view;
        let target = waterCamera.target;
        let q = waterCamera.q;
        let textureMatrix = waterCamera.textureMatrix;
        let rotationMatrix = waterCamera.rotationMatrix; // for mirror mesh.
        let eye = waterCamera.eye;

        if (!this._waterCameraObject)
        {
            this._waterCameraObject = new Object3D();
            this._waterCameraObject.position.set(0, 0, 16);
            this._waterCameraObject.rotation.set(0, 0, 0);
            this._waterCameraObject.updateMatrixWorld();
        }
        let scope = this._waterCameraObject;

        mirrorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
        cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

        rotationMatrix.extractRotation(scope.matrixWorld);

        normal.set(0, 0, 1);
        normal.applyMatrix4(rotationMatrix);

        view.subVectors(mirrorWorldPosition, cameraWorldPosition);

        // Avoid rendering when mirror is facing away
        if (view.dot(normal) > 0) return;

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

        // Update texture matrix
        textureMatrix.set(
            0.5, 0.0, 0.0, 0.5,
            0.0, 0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0
        );
        textureMatrix.multiply(mirrorCamera.projectionMatrix);
        textureMatrix.multiply(mirrorCamera.matrixWorldInverse);

        // Oblique clip
        mirrorPlane.setFromNormalAndCoplanarPoint(normal, mirrorWorldPosition);
        mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);
        clipPlane.set(mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant);
        let projectionMatrix = mirrorCamera.projectionMatrix;
        q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        q.z = -1.0;
        q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
        // Scale plane vector
        clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
        // Replace third row
        projectionMatrix.elements[2] = clipPlane.x;
        projectionMatrix.elements[6] = clipPlane.y;
        projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
        projectionMatrix.elements[14] = clipPlane.w;

        // Sunlight
        eye.setFromMatrixPosition(camera.matrixWorld);
    }

};

export { WaterCameraModule };
