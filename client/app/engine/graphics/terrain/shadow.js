
// Adapted from https://github.com/gkjohnson/threejs-sandbox/tree/master/shadow-volumes
import { BufferAttribute, FrontSide, ShaderMaterial, Vector3 } from 'three';
import { ShaderLib } from 'three/src/renderers/shaders/ShaderLib';
import { UniformsUtils } from 'three/src/renderers/shaders/UniformsUtils';
import { ShadersModule } from '../shaders/shaders';

const v0 = new Vector3();
const v1 = new Vector3();
const v2 = new Vector3();
const v01 = new Vector3();
const v12 = new Vector3();
const norm = new Vector3();

function getDynamicShadowVolumeGeometry(
    geometry,
    count)
{
    const shadowGeom = geometry.index ? geometry.toNonIndexed() : geometry.clone();

    // Generate per-face normals
    const posAttr = shadowGeom.getAttribute('position');
    if (count > posAttr.count)
    {
        console.warn('inv geom count');
        return;
    }
    let posArr = [];

    const normArr = [];
    for (let i = 0, l = count; i < l; i += 3)
    {
        v0.x = posAttr.getX(i);
        v0.y = posAttr.getY(i);
        v0.z = posAttr.getZ(i);

        v1.x = posAttr.getX(i + 1);
        v1.y = posAttr.getY(i + 1);
        v1.z = posAttr.getZ(i + 1);

        v2.x = posAttr.getX(i + 2);
        v2.y = posAttr.getY(i + 2);
        v2.z = posAttr.getZ(i + 2);

        v01.subVectors(v0, v1);
        v12.subVectors(v1, v2);

        norm.crossVectors(v01, v12).normalize();

        normArr.push(norm.x, norm.y, norm.z);
        normArr.push(norm.x, norm.y, norm.z);
        normArr.push(norm.x, norm.y, norm.z);

        posArr.push(v0.x, v0.y, v0.z);
        posArr.push(v1.x, v1.y, v1.z);
        posArr.push(v2.x, v2.y, v2.z);
    }

    let indexArr = [];

    // 1. Front cap generation using the existing geometry
    const addFrontCap = true;
    if (addFrontCap)
    {
        indexArr = new Array(count).fill()
            .map((e, i) => i);
    }

    // 2. Computing boundary edges
    const edgeHash = new Map();
    for (let i = 0, l = count; i < l; i += 3)
    {
        for (let j = 0; j < 3; j++)
        {
            const e00 = i + j;
            const e01 = i + (j + 1) % 3;

            v0.x = posAttr.getX(e00);
            v0.y = posAttr.getY(e00);
            v0.z = posAttr.getZ(e00);

            v1.x = posAttr.getX(e01);
            v1.y = posAttr.getY(e01);
            v1.z = posAttr.getZ(e01);

            // Diagonal edges don’t need to be filled.
            const del = (v0.x === v1.x) + (v0.y === v1.y) + (v0.z === v1.z);
            if (del !== 2) continue;

            // Compute an edge hash (order by z, x, then y).
            let hash;
            if (v1.z !== v0.z)
                hash = v0.z < v1.z ?
                    ~~v0.x + ',' + ~~v0.y + ',' + ~~v0.z + ',' + ~~v1.x + ',' + ~~v1.y + ',' + ~~v1.z :
                    ~~v1.x + ',' + ~~v1.y + ',' + ~~v1.z + ',' + ~~v0.x + ',' + ~~v0.y + ',' + ~~v0.z;
            else if (v1.y !== v0.y)
                hash = v0.y < v1.y ?
                    ~~v0.x + ',' + ~~v0.y + ',' + ~~v0.z + ',' + ~~v1.x + ',' + ~~v1.y + ',' + ~~v1.z :
                    ~~v1.x + ',' + ~~v1.y + ',' + ~~v1.z + ',' + ~~v0.x + ',' + ~~v0.y + ',' + ~~v0.z;
            else if (v1.x !== v0.x)
                hash = v0.x < v1.x ?
                    ~~v0.x + ',' + ~~v0.y + ',' + ~~v0.z + ',' + ~~v1.x + ',' + ~~v1.y + ',' + ~~v1.z :
                    ~~v1.x + ',' + ~~v1.y + ',' + ~~v1.z + ',' + ~~v0.x + ',' + ~~v0.y + ',' + ~~v0.z;

            // Store edges.
            let edges = edgeHash.get(hash);
            if (edges)
                edges.push(e00, e01);
            else
                edgeHash.set(hash, [e00, e01]);
        }
    }

    // 3. Process edges to fill with new quads
    let nbVerts = posArr.length / 3;
    edgeHash.forEach(edges =>
    {
        let l = edges.length;
        let nbEdges = l / 2;
        if (nbEdges === 2)
        {
            // 4 vertices = manifold edge.
            const e00 = edges[0];
            const e01 = edges[1];
            const e10 = edges[2];
            const e11 = edges[3];
            const x1 = normArr[3 * e00];
            const y1 = normArr[3 * e00 + 1];
            const z1 = normArr[3 * e00 + 2];
            const x2 = normArr[3 * e11];
            const y2 = normArr[3 * e11 + 1];
            const z2 = normArr[3 * e11 + 2];

            // Edges between neighbour faces don’t need a quad.
            if (x1 === x2 && y1 === y2 && z1 === z2) return;

            // Fill with a quad.
            indexArr.push(e00);
            indexArr.push(e11);
            indexArr.push(e10);

            indexArr.push(e00);
            indexArr.push(e10);
            indexArr.push(e01);
        }
        else if (nbEdges === 1)
        {
            // 2 vertices: boundary edge.
            const e0 = edges[0];
            const e1 = edges[1];

            // Add two vertices.
            const e2 = nbVerts;
            const e3 = e2 + 1;
            nbVerts += 2;
            posArr.push(posAttr.getX(e0), posAttr.getY(e0), posAttr.getZ(e0));
            posArr.push(posAttr.getX(e1), posAttr.getY(e1), posAttr.getZ(e1));

            normArr.push(0, 0, -1);
            normArr.push(0, 0, -1);

            // Make two quads.
            indexArr.push(e0);
            indexArr.push(e3);
            indexArr.push(e1);

            indexArr.push(e0);
            indexArr.push(e2);
            indexArr.push(e3);
        }
        else if (nbEdges === 3)
        {
            // 6 vertices: non-manifold boundary edge.
            // TODO [SHADOWS] handle non-manifold edges
            // This can be computed with normals.
        }
        else if (nbEdges === 4)
        {
            // 8 vertices: non manifold, non-boundary edge.
            // TODO [SHADOWS] handle non-manifold non-boundary edges
            // Same, can be computed with normals, but quite a handful of cases to manage.
        }
        else {
            console.warn('[ShadowVolumes] Non-manifold edge with more than four faces.');
        }
    });

    const normAttr = new BufferAttribute(new Float32Array(normArr), 3, false);
    shadowGeom.setAttribute('normal', normAttr);

    const indexAttr = new BufferAttribute(new Uint32Array(indexArr), 1, false);
    shadowGeom.setIndex(indexAttr);

    const positionAttr = new BufferAttribute(new Float32Array(posArr), 3, false);
    shadowGeom.setAttribute('position', positionAttr);

    return shadowGeom;
}

function createShadowCastingMaterial(
    angleBias
)
{
    let lightPosition = new Vector3();
    let eyePosition = new Vector3();
    let customUniforms = UniformsUtils.merge([
        // ShaderLib.lambert.uniforms,
        ShaderLib.basic.uniforms,
        {
            lightPosition: { value: lightPosition },
            eyePosition: { value: eyePosition },
            bias: { value: angleBias },
        }
    ]);

    return new ShaderMaterial({
        uniforms: customUniforms,
        vertexShader: ShadersModule.getShadowVertexShader(),
        fragmentShader: ShaderLib.basic.fragmentShader,
        // fragmentShader: ShaderLib.lambert.fragmentShader,
        // lights: true,
        // transparent: true,
        // wireframe: true,
        // flatShading: true,
        side: FrontSide
    });
}

export {
    getDynamicShadowVolumeGeometry,
    createShadowCastingMaterial
};
