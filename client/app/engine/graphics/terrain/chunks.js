/**
 *
 */

'use strict';

import {
    BufferAttribute, BufferGeometry,
    Color, Mesh,
    Vector3
} from 'three';
import { ItemType } from '../../../model/server/self/items';
import { createShadowCastingMaterial, getDynamicShadowVolumeGeometry } from './shadow';

const debugChunks = false;

let ChunksModule = {

    createChunk(
        chunkId, all, chunkSizeX, chunkSizeY, chunkSizeZ,
        isWorldFlat, worldId)
    {
        let components = all[0];
        let natures = all[1];

        // console.log(components);
        // console.log(natures);

        let currentComponent;
        let currentNatures;

        if (!components.hasOwnProperty('1') && !components.hasOwnProperty('2'))
        {
            if (debugChunks) console.log(`[Terrain/Chunks] Empty chunk "${chunkId}".`);
            return this.createEmptyChunkComponent(
                chunkId,
                chunkSizeX, chunkSizeY, chunkSizeZ,
                worldId, isWorldFlat
            );
        }

        let hasTerrain = components.hasOwnProperty('1') && natures.hasOwnProperty('1');
        let hasWater = components.hasOwnProperty('2') && natures.hasOwnProperty('2');

        if (debugChunks)
        {
            if (!hasTerrain) console.log('New chunk with empty terrain.');
            if (!hasWater) console.log('New chunk with empty water.');
        }

        let component1;
        if (hasTerrain && hasWater)
        {
            currentComponent = components['1'];
            currentNatures = natures['1'];
            component1 = this.createChunkComponent(
                chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
                currentComponent, currentNatures, false, 0,
                isWorldFlat, worldId
            );

            currentComponent = components['2'];
            currentNatures = natures['2'];
            let component2 = this.createChunkComponent(
                chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
                currentComponent, currentNatures, true, 1,
                isWorldFlat, worldId
            );

            // Merge
            component1.capacities.push(component2.capacities[0]);
            component1.geometries.push(component2.geometries[0]);
            // component1.materials.push(component2.materials[0]);
            component1.sizes.push(component2.sizes[0]);
            component1.water.push(component2.water[0]);
            component1.meshes.push(component2.meshes[0]);
            // let s1 = component1.whereToFindFace.size;
            // let s2 = component2.whereToFindFace.size;

            component1.whereToFindFace =
                new Map([...component1.whereToFindFace, ...component2.whereToFindFace]);
            component1.whichFaceIs =
                new Map([...component1.whichFaceIs, ...component2.whichFaceIs]);

            // let s3 = component1.whereToFindFace.size;
            // console.log(`${s1} + ${s2} = ${s3}`);
        } else if (hasTerrain) {
            currentComponent = components['1'];
            currentNatures = natures['1'];
            component1 = this.createChunkComponent(
                chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
                currentComponent, currentNatures, false, 0,
                isWorldFlat, // although not water so not important
                worldId
            );
        } else if (hasWater) {
            currentComponent = components['2'];
            currentNatures = natures['2'];
            component1 = this.createChunkComponent(
                chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
                currentComponent, currentNatures, true, 0,
                isWorldFlat,
                worldId
            );
        }

        return component1;
    },

    createDebugMesh(chunk,
        chunkSizeX, chunkSizeY, chunkSizeZ,
        iChunkOffset, jChunkOffset, kChunkOffset)
    {
        chunk.debugMesh = this.createChunkDebugMesh(chunkSizeX, chunkSizeY, chunkSizeZ);
        chunk.debugMesh.position.set(
            iChunkOffset + chunkSizeX / 2,
            jChunkOffset + chunkSizeY / 2,
            kChunkOffset + chunkSizeZ / 2);
    },

    createEmptyChunkComponent(
        chunkId,
        chunkSizeX, chunkSizeY, chunkSizeZ,
        worldId, isWorldFlat
    )
    {
        let sunCapacity = this._defaultEmptyChunkSize; // Math.floor(3 / 2 * triangles);
        if (this.debug) {
            console.log(`On chunk ${chunkId}, init geometry will be ${sunCapacity * 3 * 3}-capable.`);
        }

        let geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(sunCapacity * 3 * 3), 3));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(sunCapacity * 3 * 3), 3));
        geometry.setAttribute('color', new BufferAttribute(new Float32Array(sunCapacity * 3 * 3), 3));
        geometry.setAttribute('uv', new BufferAttribute(new Float32Array(sunCapacity * 3 * 2), 2));
        geometry.computeBoundingSphere();

        let newMesh = this.createChunkMesh(geometry, false,
            false, worldId); // flat world or not, no water creation
        // let material = newMesh.material;
        // let material = this.createMaterial('textured-phong', 0xaaaaaa);
        // let newMesh = new Mesh(geometry, material);

        if (isWorldFlat && this.hasShadowMap() && parseInt(worldId, 10) === -1)
        {
            newMesh.castShadow = true;
            newMesh.receiveShadow = true;
        }
        // if (Math.random() < 0.5)
        newMesh.userData.bloom = true;

        let c = {
            geometries:         [geometry],
            // materials:          [material],
            meshes:             [newMesh],
            water:              [false], // is water

            capacities:         [sunCapacity / 2], // 2 triangles per face
            sizes:              [0 / 2],

            whereToFindFace:    new Map(),
            whichFaceIs:        new Map()
        };

        if (this._debugChunkBoundingBoxes) {
            let chunkIndices = chunkId.split(',');
            let iChunkOffset = parseInt(chunkIndices[0], 10) * chunkSizeX;
            let jChunkOffset = parseInt(chunkIndices[1], 10) * chunkSizeY;
            let kChunkOffset = parseInt(chunkIndices[2], 10) * chunkSizeZ;
            this.createDebugMesh(c,
                chunkSizeX, chunkSizeY, chunkSizeZ,
                iChunkOffset, jChunkOffset, kChunkOffset
            );
        }

        return c;
    },

    createChunkComponent(
        chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
        currentComponent, currentNatures,
        isWater, componentIndex, isWorldFlat, worldId
    )
    {
        let chunkIndices = chunkId.split(',');
        let iChunkOffset = parseInt(chunkIndices[0], 10) * chunkSizeX;
        let jChunkOffset = parseInt(chunkIndices[1], 10) * chunkSizeY;
        let kChunkOffset = parseInt(chunkIndices[2], 10) * chunkSizeZ;

        let iS = chunkSizeX;
        let ijS = chunkSizeX * chunkSizeY;
        let ijkS = ijS * chunkSizeZ;

        let triangles = 2 * currentComponent.length;
        let sunCapacity = Math.floor(3 / 2 * triangles);
        sunCapacity += sunCapacity % 2; // Make it pair
        if (this.debug)
            console.log(`On chunk ${chunkId}, init geometry will be ${sunCapacity * 3 * 3}-capable.`);

        let positions = new Float32Array(sunCapacity * 3 * 3);
        let normals = new Float32Array(sunCapacity * 3 * 3);
        let colors = new Float32Array(sunCapacity * 3 * 3);
        let uvs = new Float32Array(sunCapacity * 3 * 2);

        let pA = new Vector3(); let pB = new Vector3();
        let pC = new Vector3(); let cb = new Vector3();
        let ab = new Vector3(); let color = new Color();

        let whereToFindFace = new Map();
        let whichFaceIs = new Map();

        let i = 0;
        for (let f = 0; f < currentComponent.length; ++f) {
            let faceId = Math.abs(currentComponent[f]);

            let newGeometryId = componentIndex;
            whereToFindFace.set(faceId, [newGeometryId, f]);
            // [In which geometry a given face is, at which position]
            let wf0 = whichFaceIs.get(newGeometryId);
            if (wf0 === undefined) {
                wf0 = new Map();
                whichFaceIs.set(newGeometryId, wf0);
            }
            wf0.set(f, faceId);

            let normal = currentNatures[f] > 0;

            this.addFace(faceId, i, iS, ijS, ijkS,
                positions, normals, colors, uvs, Math.abs(currentNatures[f]),
                iChunkOffset, jChunkOffset, kChunkOffset,
                pA, pB, pC, cb, ab,
                normal, color);

            ++i;
        }

        let geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new BufferAttribute(normals, 3));
        geometry.setAttribute('color', new BufferAttribute(colors, 3));
        geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
        geometry.computeBoundingSphere();

        // let material;
        // material = this.createMaterial('textured-phong', 0xaaaaaa);
        // if (isWater) { // transparency
        //     material.transparent = true;
        //     material.opacity = 0.3;
        //     material.side = DoubleSide;
        // }

        let newMesh = this.createChunkMesh(geometry, isWater, isWorldFlat, worldId);
        // let material = newMesh.material;
        // let newMesh = new Mesh(geometry, material);
        // if (Math.random() < 0.5)
        let shadowMesh;
        if (!isWater)
        {
            // s.material.uniforms.sunPosition.value
            // if (iChunkOffset === 0 &&
            //     jChunkOffset === -32 &&
            //     kChunkOffset === 0)
            // {
            //     shadowMesh = new Mesh(
            //         getDynamicShadowVolumeGeometry(geometry, triangles * 3),
            //         createShadowCastingMaterial(0.0)
            //     );
            // }
            const isMainWorld = parseInt(worldId, 10) === -1;
            if (isWorldFlat && this.hasShadowVolumes() && isMainWorld)
            {
                shadowMesh = new Mesh(
                    getDynamicShadowVolumeGeometry(geometry, triangles * 3),
                    createShadowCastingMaterial(0.0)
                );
            }

            if (isWorldFlat && this.hasShadowMap() && isMainWorld)
            {
                newMesh.castShadow = true;
                newMesh.receiveShadow = true;
            }
            newMesh.userData.bloom = true;
        }

        let c = {
            geometries:         [geometry],
            // materials:          [material],
            meshes:             [newMesh],
            water:              [isWater], // is water

            capacities:         [sunCapacity / 2],
            sizes:              [triangles / 2],

            shadow:             shadowMesh,

            whereToFindFace,
            whichFaceIs
        };

        if (this._debugChunkBoundingBoxes) {
            this.createDebugMesh(c,
                chunkSizeX, chunkSizeY, chunkSizeZ,
                iChunkOffset, jChunkOffset, kChunkOffset
            );
        }

        return c;
    },

    updateChunk(
        worldId, chunk, chunkId, components,
        chunkSizeX, chunkSizeY, chunkSizeZ,
        isWorldFlat)
    {
        let geometries =        chunk.geometries;
        // let materials =         chunk.materials;
        let meshes =            chunk.meshes;
        let capacities =        chunk.capacities;
        let sizes =             chunk.sizes;
        let water =             chunk.water;
        let whereToFindFace =   chunk.whereToFindFace;
        let whichFaceIs =       chunk.whichFaceIs;

        let removed =   components[0];
        let added =     components[1];
        let updated =   components[2];

        if (this.debug)
        {
            console.log('BUD');
            console.log(removed);
            console.log(added);
            console.log(updated);
        }

        // Bundle updated faces.
        for (let uid in updated)
        {
            if (!updated.hasOwnProperty(uid)) continue;
            let update = updated[uid];
            removed[uid] = null;
            added[uid] = update;
        }

        this.removeChunkFaces(
            worldId, removed,
            geometries, meshes, capacities, sizes, whereToFindFace, whichFaceIs);

        this.addChunkFaces(
            worldId, added, geometries, meshes, capacities, sizes,
            water, whereToFindFace, whichFaceIs,
            chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
            isWorldFlat);

        if (this.hasShadowVolumes() && chunk.shadow)
        {
            for (let m = 0; m < meshes.length; ++m)
            {
                if (water[m]) continue;

                let g = geometries[m];
                let s = sizes[m];
                // Rebuild whole shadow volume.
                // This is extremely inefficient.
                this.removeFromShadows(chunk.shadow);
                chunk.shadow = new Mesh(
                    getDynamicShadowVolumeGeometry(g, s * 2 * 3),
                    createShadowCastingMaterial(0.0)
                );
                this.addToShadows(chunk.shadow);

                // Only on first geometry (bundles unsupported atm)
                break;
            }
        }
    },

    removeChunkFaces(
        worldId, removed,
        geometries, meshes, capacities, sizes,
        whereToFindFace, whichFaceIs
    )
    {
        let geometry; let vertices; let colors; let normals; let uvs;
        let meshId;

        for (let rrid in removed)
        {
            if (!removed.hasOwnProperty(rrid)) continue;

            let rid = parseInt(rrid, 10);
            // Get graphic data
            if (!whereToFindFace.has(rid)) {
                console.log(`Trying to remove a face that is not present in chunk: ${rid}`);
                continue;
            }

            let wtffrid = whereToFindFace.get(rid);
            meshId = wtffrid[0];
            let position = wtffrid[1];

            geometry = geometries[meshId];

            vertices =  geometry.attributes.position.array;
            colors =    geometry.attributes.color.array;
            normals =   geometry.attributes.normal.array;
            uvs =       geometry.attributes.uv.array;
            let lastPosition = sizes[meshId] - 1;
            let isLast = lastPosition === position;

            // Update
            let i; let p;
            if (isLast) {
                for (i = 0; i < 18; ++i) {
                    p = 18 * position + i;
                    // Delete current
                    vertices[p] = normals[p] = colors[p] = 0;
                }
                for (i = 0; i < 12; ++i) {
                    uvs[12 * position + i] = 0;
                }
            } else {
                for (i = 0; i < 18; ++i) {
                    p = 18 * position + i;
                    // Swap current with last
                    let lp = 18 * lastPosition + i;
                    vertices[p] = vertices[lp];
                    normals[p]  = normals[lp];
                    colors[p]   = colors[lp];
                    // Delete last
                    vertices[lp] = normals[lp] = colors[lp] = 0;
                }
                for (i = 0; i < 12; ++i) {
                    p = 12 * position + i;
                    let lp1 = 12 * lastPosition + i;
                    uvs[p] = uvs[lp1];
                    uvs[lp1] = 0;
                }
            }

            // Update helpers (swap last if applicable).
            if (!isLast) {
                let whichFaceIsMeshId = whichFaceIs.get(meshId);
                if (whichFaceIsMeshId.get(lastPosition) === undefined) {
                    console.log('WARN: swapping');
                    console.log(
                        `${whichFaceIs[meshId][lastPosition]} @mesh ${meshId} ` +
                        `@lastposition ${lastPosition} @position ${position}`);
                }

                whereToFindFace.set(whichFaceIsMeshId.get(lastPosition), [meshId, position]);
                whichFaceIsMeshId.set(position, whichFaceIsMeshId.get(lastPosition));
            }

            whichFaceIs.get(meshId).delete(lastPosition);
            whereToFindFace.delete(rid);
            sizes[meshId] -= 1;

            // Delete geometry if applicable.
            if (sizes[meshId] === 0) {
                console.log('INFO: geometry deletion.');
                // Remove mesh from scene.
                this.removeFromScene(meshes[meshId], worldId);
                geometries[meshId]  = undefined;
                // materials[meshId]   = undefined;
                meshes[meshId]      = undefined;
                sizes[meshId]       = undefined;
                capacities[meshId]  = undefined;
                whichFaceIs.delete(meshId);
            } else {
                // Notify object
                geometry.attributes.position.needsUpdate = true;
                geometry.attributes.color.needsUpdate = true;
                geometry.attributes.normal.needsUpdate = true;
                geometry.attributes.uv.needsUpdate = true;
                geometry.computeBoundingSphere();
            }
        }
    },

    addChunkFaces(
        worldId, added,
        geometries, meshes, capacities, sizes, water,
        whereToFindFace, whichFaceIs,
        chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
        isWorldFlat)
    {
        let geometry; let vertices; let colors; let normals; let uvs;
        let meshId; let faceId;

        let iS = chunkSizeX;
        let ijS = chunkSizeX * chunkSizeY;
        let ijkS = ijS * chunkSizeZ;

        let chunkIndices = chunkId.split(',');
        let chunkI = parseInt(chunkIndices[0], 10); let iChunkOffset = chunkI * chunkSizeX;
        let chunkJ = parseInt(chunkIndices[1], 10); let jChunkOffset = chunkJ * chunkSizeY;
        let chunkK = parseInt(chunkIndices[2], 10); let kChunkOffset = chunkK * chunkSizeZ;
        let defaultGeometrySize = this.defaultGeometrySize;

        for (let aaid in added)
        {
            if (!added.hasOwnProperty(aaid)) continue;
            let aid = parseInt(aaid, 10);

            // Get graphic data
            faceId = Math.abs(aid);
            if (whereToFindFace.hasOwnProperty(faceId)) {
                console.log('Trying to add a face that is already present in chunk.');
                continue;
            }

            let nature = added[aid];
            // If water, add into water mesh.
            let isWater = Math.abs(nature) === ItemType.BLOCK_WATER;

            // Compute mesh id.
            meshId = 0;
            let meshHasToBeAdded = false;
            while (meshes[meshId] !== undefined &&
                (sizes[meshId] === capacities[meshId] ||
                water[meshId] !== isWater))
            {
                ++meshId;
            }

            // Add new mesh if necessary.
            meshHasToBeAdded = sizes[meshId] === undefined;

            if (this.debug) {
                let progress = Math.floor(100 * sizes[meshId] / capacities[meshId]);
                if (progress % 20 === 0) console.log(`INFO: Geometry ${meshId} at ${progress}% capacity.`);
            }

            if (meshHasToBeAdded) {
                if (this.debug) {
                    console.log('INFO: Geometry addition: ' +
                        `${meshId}` +
                        `${meshId % 10 === 1 ? 'st' : meshId % 10 === 2 ? 'nd' : meshId % 10 === 3 ? 'rd' : 'th'}` +
                        ' geometry.');
                }

                // Create geometry.
                geometry = new BufferGeometry();
                geometries[meshId] = geometry;
                // let newMaterial = this.createMaterial('textured-phong', 0xb8860b);
                // if (isWater) {
                //     newMaterial.transparent = true;
                //     newMaterial.opacity = 0.3;
                //     newMaterial.side = FrontSide;
                // }
                // materials[meshId] = newMaterial;

                sizes[meshId] = 1;
                water[meshId] = isWater;
                whichFaceIs.set(meshId, new Map());

                let triangles = 2 * defaultGeometrySize;
                let sunCapacity = Math.floor(3 / 2 * triangles);
                capacities[meshId] = sunCapacity / 2;

                vertices = new Float32Array(sunCapacity * 3 * 3);
                normals = new Float32Array(sunCapacity * 3 * 3);
                colors = new Float32Array(sunCapacity * 3 * 3);
                uvs = new Float32Array(sunCapacity * 3 * 2);

                if (this.debug) {
                    console.log(`New capacity will be ${sunCapacity * 3 * 3}.`);
                }
            } else {
                geometry = geometries[meshId];
                sizes[meshId] += 1;
                vertices =  geometry.attributes.position.array;
                colors =    geometry.attributes.color.array;
                normals =   geometry.attributes.normal.array;
                uvs =       geometry.attributes.uv.array;
            }

            // Add face.
            let pA = new Vector3();
            let pB = new Vector3();
            let pC = new Vector3();
            let cb = new Vector3();
            let ab = new Vector3();
            let n = 800;
            let color = new Color();
            let pos = sizes[meshId] - 1;

            let normal = nature > 0;
            whereToFindFace.set(aid, [meshId, pos]);
            let wfi = whichFaceIs.get(meshId);
            if (!wfi) {
                let m = new Map();
                m.set(pos, aid);
                whichFaceIs.set(meshId, m);
            } else {
                wfi.set(pos, aid);
            }

            this.addFace(faceId, pos, iS, ijS, ijkS,
                vertices, normals, colors, uvs, Math.abs(nature),
                iChunkOffset, jChunkOffset, kChunkOffset,
                pA, pB, pC, cb, ab,
                normal, color, n);

            if (meshHasToBeAdded)
            {
                geometry.setAttribute('position', new BufferAttribute(vertices, 3));
                geometry.setAttribute('normal', new BufferAttribute(normals, 3));
                geometry.setAttribute('color', new BufferAttribute(colors, 3));
                geometry.setAttribute('uv', new BufferAttribute(uvs, 2));

                // let addedMesh = new Mesh(geometry, materials[meshId]);
                // meshes[meshId] = addedMesh;
                let newMesh = this.createChunkMesh(geometry, isWater, isWorldFlat, worldId);
                // let newMesh = new Mesh(geometry, materials[meshId]);

                if (this.hasShadowMap() && isWorldFlat && parseInt(worldId, 10) === -1)
                {
                    newMesh.castShadow = true;
                    newMesh.receiveShadow = true;
                }
                // if (Math.random() < 0.25)
                newMesh.userData.bloom = true;
                meshes[meshId] = newMesh;
                this.addToScene(newMesh, worldId);
            }

            // Notify object.
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.color.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;
            geometry.attributes.uv.needsUpdate = true;
            geometry.computeBoundingSphere();
        }
    },

};

export { ChunksModule };
