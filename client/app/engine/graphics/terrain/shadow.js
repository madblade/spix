
// From https://github.com/gkjohnson/threejs-sandbox/tree/master/shadow-volumes
import { BackSide, BufferAttribute, FrontSide, ShaderMaterial, Vector3 } from 'three';
import { ShaderLib } from 'three/src/renderers/shaders/ShaderLib';
import { UniformsUtils } from 'three/src/renderers/shaders/UniformsUtils';
import { ShadersModule } from '../shaders/shaders';

const v0 = new Vector3();
const v1 = new Vector3();
const v2 = new Vector3();
const v01 = new Vector3();
const v12 = new Vector3();
const norm = new Vector3();
function vecToString(v)
{
    const x = ~~v.x;
    const y = ~~v.y;
    const z = ~~v.z;
    return `${x},${y},${z}`;
}

function getDynamicShadowVolumeGeometry(
    geometry,
    count)
{
    const shadowGeom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    // for (const key in shadowGeom.attributes) {
    //     if (!shadowGeom.attributes.hasOwnProperty(key)) continue;
    //     shadowGeom.attributes[key] = shadowGeom.attributes[key].clone();
    // }

    // Generate per-face normals
    // let count = posAttr.count;
    const posAttr = shadowGeom.getAttribute('position');
    if (count > posAttr.count)
    {
        console.warn('inv geom count');
        return;
    }

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
    }
    const normAttr = new BufferAttribute(new Float32Array(normArr), 3, false);
    shadowGeom.setAttribute('normal', normAttr);

    // generate an edge map
    // const vertHash = new Map(); // {};
    // const vertMap = new Map(); // {};
    // for (let i = 0, l = count; i < l; ++i)
    // {
    //     const x = posAttr.getX(i);
    //     const y = posAttr.getY(i);
    //     const z = posAttr.getZ(i);
    //     const str = `${x},${y},${z}`;
    //
    //     const vhstr = vertHash.get(str);
    //     if (vhstr)
    //     {
    //         vertMap.set(i, vhstr);
    //         vertMap.set(vhstr, i);
    //     } else
    //         vertHash.set(str, i);
    // }

    // generate the new index array
    let indexArr = [];
    const addFrontCap = true;
    if (addFrontCap)
    {
        indexArr = new Array(count).fill()
            .map((e, i) => i);
    }
    const edgeHash = new Map(); // {};
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

            const del = (v0.x === v1.x) + (v0.y === v1.y) + (v0.z === v1.z);
            if (del !== 2) continue;
            // let str0 = vecToString(v0);
            // let str1 = vecToString(v1);
            // let hash0 = `${str0},${str1}`;
            // let hash1 = `${str1},${str0}`;
            const hash0 = ~~v0.x + ',' + ~~v0.y + ',' + ~~v0.z + ',' + ~~v1.x + ',' + ~~v1.y + ',' + ~~v1.z;
            const hash1 = ~~v1.x + ',' + ~~v1.y + ',' + ~~v1.z + ',' + ~~v0.x + ',' + ~~v0.y + ',' + ~~v0.z;
            // const hash1 = `${~~v1.x},${~~v1.y},${~~v1.z},${~~v0.x},${~~v0.y},${~~v0.z}`;

            if (edgeHash.has(hash0) || edgeHash.has(hash1))
            {
                const [e10, e11] = edgeHash.get(hash0);

                edgeHash.delete(hash0);
                edgeHash.delete(hash1);

                indexArr.push(e00);
                indexArr.push(e11);
                indexArr.push(e10);

                indexArr.push(e00);
                indexArr.push(e10);
                indexArr.push(e01);
            }
            else
            {
                edgeHash.set(hash0, [e00, e01]);
                edgeHash.set(hash1, [e00, e01]);
            }
        }
    }
    // edgeHash.forEach(edge =>
    // {
    //     const e0 = edge[0];
    //     const e1 = edge[1];
    //     posAttr.setX(e0, 0);
    //     posAttr.setX(e1, 0);
    //     posAttr.setY(e0, 0);
    //     posAttr.setY(e1, 0);
    //     posAttr.setZ(e0, 0);
    //     posAttr.setZ(e1, 0);
    // });

    const indexAttr = new BufferAttribute(new Uint32Array(indexArr), 1, false);
    shadowGeom.setIndex(indexAttr);

    return shadowGeom;
}

function createShadowCastingMaterial(
    angleBias
)
{
    let lightPosition = new Vector3();
    let eyePosition = new Vector3();
    let customUniforms = UniformsUtils.merge([
        ShaderLib.lambert.uniforms,
        // ShaderLib.basic.uniforms,
        {
            lightPosition: { value: lightPosition },
            eyePosition: { value: eyePosition },
            bias: { value: angleBias },
        }
    ]);

    return new ShaderMaterial({
        uniforms: customUniforms,
        vertexShader: ShadersModule.getShadowVertexShader(),
        // fragmentShader: ShaderLib.basic.fragmentShader,
        fragmentShader: ShaderLib.lambert.fragmentShader,
        lights: true,
        transparent: true,
        side: FrontSide
    });
    // return new ShaderMaterial({
    //     uniforms: customUniforms,
    //     vertexShader: ShadersModule.getShadowVertexShader(),
    //     fragmentShader: ShadersModule.getShadowFragmentShader(),
    //     // fragmentShader: ShaderLib.basic.fragmentShader,
    //     // fragmentShader: ShaderLib.basic.fragmentShader,
    //     // lights: true,
    //     transparent: true,
    //     opacity: 0,
    //     side: FrontSide
    // });
}

export {
    getDynamicShadowVolumeGeometry,
    createShadowCastingMaterial
};
