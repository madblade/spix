/**
 *
 */

'use strict';

import { Entity } from './entity.js';
import {
    BufferAttribute, BufferGeometry, DoubleSide, Line,
    LineDashedMaterial, Mesh, Object3D, RingBufferGeometry, ShaderMaterial
} from 'three';
import { ItemType } from '../self/items';
import { ShadersModule } from '../../../engine/graphics/shaders/shaders';

let PlayerModule = {

    createMeleeMesh()
    {
        const innerRadius = 0.5;
        const outerRadius = 1.3;
        let ringGeometry = new RingBufferGeometry(
            innerRadius,
            outerRadius,
            20, 1,
            0, Math.PI
        );
        let params = {
            uniforms: {
                time: { value: 0.0 },
                outerRadius: { value: outerRadius },
                innerRadius: { value: innerRadius }
            },
            vertexShader: ShadersModule.getSwordTrailVertexShader(),
            fragmentShader: ShadersModule.getSwordTrailFragmentShader(),
            side: DoubleSide,
            transparent: true,
            depthTest: false
        };
        let material = new ShaderMaterial(params);

        let meleeEffectMesh = new Mesh(
            ringGeometry,
            material
        );
        meleeEffectMesh.userData.bloom = true;

        let wrapper = new Object3D();
        wrapper.position.set(0, 0, 0);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper.add(meleeEffectMesh);
        meleeEffectMesh.rotation.set(0, Math.PI / 2 + Math.PI / 4, 0);
        meleeEffectMesh.position.set(1, 1, -0.5);
        meleeEffectMesh.renderOrder = 999;

        let up = new Object3D();
        wrapper.rotation.reorder('ZYX');
        meleeEffectMesh.rotation.reorder('ZYX');
        up.add(wrapper);
        up.getWrapper = function() {
            return wrapper;
        };
        up.getMesh = function() {
            return meleeEffectMesh;
        };

        return up;
    },

    createArrowTrail(p)
    {
        let MAX_POINTS = 250;

        let geometry = new BufferGeometry();

        let positions = new Float32Array(MAX_POINTS * 3); // 3 vertices per point
        geometry.setAttribute('position', new BufferAttribute(positions, 3));

        let index = 0;
        positions[index++] = p.x;
        positions[index++] = p.y;
        positions[index++] = p.z;

        let drawCount = 1; // draw the first x points, only
        geometry.setDrawRange(0, drawCount);
        geometry.attributes.position.needsUpdate = true;
        geometry.computeBoundingSphere();

        // let material = new LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
        let material = new LineDashedMaterial({
            color: 0xffff00,
            linewidth: 2,
            scale: 1,
            dashSize: 3,
            gapSize: 1
        });

        let line = new Line(geometry,  material);
        line.computeLineDistances();
        return line;
    },

    loadArrow(
        id, updatedEntity, graphics, entities
    )
    {
        let wrapper = new Object3D();
        let cube = graphics.getItemMesh(ItemType.YA, false, true);

        cube.userData.bloom = true;
        wrapper.add(cube);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper._id = id;

        let up = new Object3D();
        up.rotation.reorder('ZYX');
        up.add(wrapper);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        up._id = id;
        //delete createdEntity._id;
        up.getWrapper = function() {
            return wrapper;
        };

        let entity = new Entity(
            id, up,
            parseInt(updatedEntity.w, 10)
        );
        entity.isProjectile = true;

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
        entity.inScene = true;
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        let p = entity.position;
        let helper = this.createArrowTrail(entity.position);
        entity.setHelper(helper);
        graphics.addToScene(entity.getHelper(), entity.getWorldId());

        up.position.set(p.x, p.y, p.z);
        entity.lastPFromServer.set(p.x, p.y, p.z);
        entity.currentPFromServer.set(p.x, p.y, p.z);
        let rr = this.app.model.server.selfModel.rotation;
        let r = entity.rotation;
        r.set(rr[1], rr[2], rr[3]);
        let object3D = entity.getObject3D();
        object3D.rotation.x = r.z; // ur[3];
        object3D.rotation.z = r.y; // ur[2];
        object3D.getWrapper().rotation.y = Math.PI + r.x;
        entity.lastRFromServer.set(r.x, r.y, r.z);
        entity.currentRFromServer.set(r.x, r.y, r.z);
        this.entitiesLoading.delete(id);
    },

    loadCube(id, updatedEntity, graphics, entities)
    {
        // This should be done in graphics
        let wrapper = new Object3D();
        let cube = graphics.createMesh(
            graphics.createGeometry('box'),
            graphics.createMaterial('flat-phong', 0x5e2c04)
        );
        wrapper.add(cube);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper._id = id;

        let up = new Object3D();
        up.rotation.reorder('ZYX');
        up.add(wrapper);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        up._id = id;
        //delete createdEntity._id;
        up.getWrapper = function() {
            return wrapper;
        };

        let entity = new Entity(
            id, up,
            parseInt(updatedEntity.w, 10)
        );
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);
    },

    loadPlayer(id, updatedEntity, graphics, entities)
    {
        let color = updatedEntity.a ? 0x00ff00 : 0xff0000;
        let createdEntity = graphics.initializeEntity(
            id, 'steve', color
        );
        let object3D = graphics.finalizeEntity(
            id, createdEntity, color
        );

        let entity = new Entity(id, object3D, parseInt(updatedEntity.w, 10));
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);
    }

};

export { PlayerModule };
