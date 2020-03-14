/**
 * Planet object.
 */

'use strict';

import * as THREE from 'three';

import extend       from '../../../extend';

import { ShadersModule }  from '../shaders/shaders';

let SimplePlanet = function()
{
    this.radius = 2; // 6371e3;
    this.mass = 5.972e24;
    this.atmos_scale_height = 7.64e3;

    let geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    let material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('../../../assets/images/2_no_clouds_8k.jpg'),
        bumpMap: THREE.ImageUtils.loadTexture('../../../assets/images/elev_bump_8k.jpg'),
        bumpScale:   0.005,
        specularMap: THREE.ImageUtils.loadTexture('../../../assets/images/water_8k.png'),
    });

    let position = new THREE.Vector3();
    position.set(0, 5, 0); // -10e6);

    THREE.Mesh.call(this, geometry, material);
    this.position.copy(position);
};

SimplePlanet.prototype = Object.create(THREE.Mesh.prototype);

let Atmosphere = function(planet)
{
    let atmosVertex = ShadersModule.getPlanetVertexShader();
    let atmosFragment = ShadersModule.getPlanetFragmentShader();

    this.planet = planet;
    // this.planet_scene = new THREE.Scene();
    // this.planet_scene.add(planet.mesh);

    //this.planet_scene.add( new THREE.AmbientLight( 0x333333 ) );
    this.sun = new THREE.DirectionalLight(0xffffff, 1);
    this.sun.position.set(0.707, 0.707, 0);
    // this.planet_scene.add(this.sun);

    this.planet_camera = new THREE.PerspectiveCamera(
        75., window.innerWidth / window.innerHeight, 1e3, 1e8);
    // base_camera.add(this.planet_camera);

    this.planet_texture = new THREE.WebGLRenderTarget(
        window.innerWidth, window.innerHeight,
        {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        }
    );

    this.base_directions = [
        new THREE.Vector3(-1, 1, 0.5), new THREE.Vector3(1, 1, 0.5),
        new THREE.Vector3(-1, -1, 0.5), new THREE.Vector3(1, -1, 0.5)];
    this.directions = [
        new THREE.Vector3(-1, 1, 0.5),
        new THREE.Vector3(1, 1, 0.5),
        new THREE.Vector3(-1, -1, 0.5),
        new THREE.Vector3(1, -1, 0.5)];

    this.directions = new Float32Array(12);
    this.directions.set([
        -1, 1, 0.5,
        1, 1, 0.5,
        -1, -1, 0.5,
        1, -1, 0.5
    ]);

    // Ugly
    var plane = new THREE.PlaneBufferGeometry(
        // 10, 10);
        window.innerWidth, window.innerHeight);

    this.rayleigh_length = 7.64e3;
    this.rayleigh_constant = 0.0025;
    this.mie_length = 2e3;
    this.mie_constant = 0.0015;
    this.radius = planet.radius + this.rayleigh_length * 5;

    this.uniforms = {
        camera_pos: { type: 'v3', value: new THREE.Vector3() },
        planet_pos: { type: 'v3', value: new THREE.Vector3() },
        planet_radius: { type: 'f', value: 0.0 },
        atmos_radius: { type: 'f', value: 0.0 },

        rayleigh_scale_depth: { type: 'f', value: this.rayleigh_length },
        k_rayleigh: { type: 'f', value: this.rayleigh_constant },
        mie_scale_depth: { type: 'f', value: this.mie_length },
        k_mie: { type: 'f', value: this.mie_constant },

        planet: { type: 't', value: this.planet_texture },
        sun: { type: 'v3', value: this.sun.position }
    };

    let sampleDir = new THREE.BufferAttribute(this.directions, 3);
    // this.attributes = {
    //     sampleDir: { type: 'v3', value: this.directions }
    // };

    let material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        // attributes: this.attributes,
        vertexShader: atmosVertex,
        fragmentShader: atmosFragment
    });

    // material = new THREE.MeshNormalMaterial();

    plane.setAttribute('sampleDir', sampleDir);

    this.mesh = new THREE.Mesh(plane, material);
    this.mesh.position.y = 20;
    this.mesh.rotation.x = Math.PI / 2;


    // this.scene = new THREE.Scene();
    // this.scene.add(this.mesh);

    this.camera = new THREE.OrthographicCamera(
        window.innerWidth / -2, window.innerWidth / 2,
        window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);

    this.time = 0;
};

extend(Atmosphere.prototype, {

    render: function() //renderer)
    {
        let offset = new THREE.Vector3();

        for (let i = 0; i < 4; ++i) {
            offset.setFromMatrixPosition(this.planet_camera.matrixWorld);
            this.directions[i].copy(this.base_directions[i]);
            this.directions[i].unproject(this.planet_camera);
            this.directions[i].sub(offset);
        }

        this.sun.position.set(Math.cos(Date.now() / 5000),
            0, Math.sin(Date.now() / 5000)).normalize();
        // this.sun.position.set(0.9, 0., 0.1).normalize();

        let scale = 1e-5;
        this.radius = this.planet.radius + this.rayleigh_length * 5;
        this.uniforms
            .camera_pos.value
            .setFromMatrixPosition(this.planet_camera.matrixWorld)
            .multiplyScalar(scale);
        this.uniforms
            .planet_pos
            .value
            .copy(this.planet.mesh.position)
            .multiplyScalar(scale);
        this.uniforms
            .planet_radius
            .value = this.planet.radius * 0.999 * scale;
        this.uniforms
            .atmos_radius
            .value = this.radius * scale;

        this.uniforms
            .rayleigh_scale_depth
            .value = this.rayleigh_length * scale;
        this.uniforms
            .k_rayleigh
            .value = this.rayleigh_constant;
        this.uniforms
            .mie_scale_depth
            .value = this.mie_length * scale;
        this.uniforms
            .k_mie
            .value = this.mie_constant;

        this.attributes.sampleDir.needsUpdate = true;
        // renderer.render(this.planet_scene, this.planet_camera, this.planet_texture, true);
        // renderer.render(this.scene, this.camera);
    }
});

export { SimplePlanet, Atmosphere };
