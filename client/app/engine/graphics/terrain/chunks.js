/**
 *
 */

'use strict';

import * as THREE from 'three';

let ChunksModule = {

    createChunk(chunkId, all, chunkSizeX, chunkSizeY, chunkSizeZ)
    {
        // TODO don't discriminate components
        // TODO discriminate components server-side
        let components = all[0];
        let natures = all[1];

        let currentComponent;
        let currentNatures;
        for (let cid in components) {
            currentComponent = components[cid];
            currentNatures = natures[cid];
            break;
        }

        if (!currentComponent) {
            console.log('Warn: missed an update'); return;
        }

        let chunkIndices = chunkId.split(',');
        let chunkI = parseInt(chunkIndices[0], 10); let iChunkOffset = chunkI * chunkSizeX;
        let chunkJ = parseInt(chunkIndices[1], 10); let jChunkOffset = chunkJ * chunkSizeY;
        let chunkK = parseInt(chunkIndices[2], 10); let kChunkOffset = chunkK * chunkSizeZ;

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

        let pA = new THREE.Vector3(); let pB = new THREE.Vector3();
        let pC = new THREE.Vector3(); let cb = new THREE.Vector3();
        let ab = new THREE.Vector3(); let color = new THREE.Color();

        let whereToFindFace = new Map();
        let whichFaceIs = new Map();

        let i = 0;
        for (let f = 0; f < currentComponent.length; ++f) {
            let faceId = Math.abs(currentComponent[f]);

            whereToFindFace.set(faceId, [0, f]); // [In which geometry a given face is, at which position]
            let wf0 = whichFaceIs.get(0);
            if (wf0 === undefined) {
                wf0 = new Map();
                whichFaceIs.set(0, wf0);
            }
            wf0.set(f, faceId);

            let normal = currentNatures[f] > 0;

            this.addFace(faceId, i, iS, ijS, ijkS,
                positions, normals, colors, uvs, Math.abs(currentNatures[f]),
                iChunkOffset, jChunkOffset, kChunkOffset,
                pA, pB, pC, cb, ab,
                normal, color);

            i += 18;
        }

        let geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.computeBoundingSphere();

        let material = this.createMaterial('textured-phong', 0xaaaaaa);

        return {
            geometries:         [geometry],
            materials:          [material],
            meshes:             [new THREE.Mesh(geometry, material)],

            capacities:         [sunCapacity / 2],
            sizes:              [triangles / 2],

            /*whereToFindFace:*/whereToFindFace,
            /*whichFaceIs:    */whichFaceIs
        };
    },

    updateChunk(worldId, chunk, chunkId, components,
                           chunkSizeX, chunkSizeY, chunkSizeZ)
    {
        let geometries =        chunk.geometries;
        let materials =         chunk.materials;
        let meshes =            chunk.meshes;
        let capacities =        chunk.capacities;
        let sizes =             chunk.sizes;
        let whereToFindFace =   chunk.whereToFindFace;
        let whichFaceIs =       chunk.whichFaceIs;

        let removed =   components[0];
        let added =     components[1];
        let updated =   components[2];

        this.removeChunkFaces(
            worldId, removed,
            geometries, materials, meshes, capacities, sizes, whereToFindFace, whichFaceIs);

        this.addChunkFaces(
            worldId, added, geometries, materials, meshes, capacities, sizes, whereToFindFace, whichFaceIs,
            chunkId, chunkSizeX, chunkSizeY, chunkSizeZ);

        this.updateChunkFaces(worldId, updated, geometries);
    },

    removeChunkFaces(worldId, removed,
                                geometries, materials, meshes, capacities, sizes,
                                whereToFindFace, whichFaceIs)
    {
        let geometry; let vertices; let colors; let normals; let uvs;
        let meshId;

        for (let rrid in removed) {
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
                this.sceneManager.removeFromScene(meshes[meshId], worldId);
                geometries[meshId]  = undefined;
                materials[meshId]   = undefined;
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

    addChunkFaces(worldId, added,
                             geometries, materials, meshes, capacities, sizes,
                             whereToFindFace, whichFaceIs,
                             chunkId, chunkSizeX, chunkSizeY, chunkSizeZ)
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

        for (let aaid in added) {
            let aid = parseInt(aaid, 10);

            // Get graphic data
            faceId = Math.abs(aid);
            if (whereToFindFace.hasOwnProperty(faceId)) {
                console.log('Trying to add a face that is already present in chunk.');
                continue;
            }

            // Compute mesh id.
            meshId = 0;
            let meshHasToBeAdded = false;
            while (sizes[meshId] !== undefined && sizes[meshId] === capacities[meshId]) ++meshId;

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
                        `${(meshId % 10 === 1 ? 'st' : meshId % 10 === 2 ? 'nd' : meshId % 10 === 3 ? 'rd' : 'th')}` +
                        ' geometry.');
                }

                // Create geometry.
                geometry = new THREE.BufferGeometry();
                geometries[meshId] = geometry;
                materials[meshId] = this.createMaterial('textured-phong', 0xb8860b);
                sizes[meshId] = 1;
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
            let pA = new THREE.Vector3();
            let pB = new THREE.Vector3();
            let pC = new THREE.Vector3();
            let cb = new THREE.Vector3();
            let ab = new THREE.Vector3();
            let n = 800;
            let color = new THREE.Color();
            let pos = sizes[meshId] - 1;

            let nature = added[aid]; // Corresponds to block id.
            let normal = nature > 0;
            whereToFindFace.set(aid, [meshId, pos]);
            whichFaceIs.get(meshId).set(pos, aid);

            this.addFace(faceId, pos * 18, iS, ijS, ijkS,
                vertices, normals, colors, uvs, Math.abs(nature),
                iChunkOffset, jChunkOffset, kChunkOffset,
                pA, pB, pC, cb, ab,
                normal, color, n);

            if (meshHasToBeAdded) {
                geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
                geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));

                meshes[meshId] = new THREE.Mesh(geometry, materials[meshId]);
                this.addToScene(meshes[meshId], worldId);
            }

            // Notify object.
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.color.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;
            geometry.attributes.uv.needsUpdate = true;
            geometry.computeBoundingSphere();
        }
    },

    // TODO [LONG-TERM] manage changes
    updateChunkFaces(worldId, updated, geometries) {
        // for (let uid in updated) {
        // }
        if (window.debug) {
            console.log(worldId);
            console.log(updated);
            console.log(geometries);
        }
    }

};

export { ChunksModule };
