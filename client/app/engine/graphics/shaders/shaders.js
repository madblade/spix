/**
 *
 */

'use strict';

// Portals
import PortalFragment       from './portal/portal.fragment.glsl';
import PortalVertex         from './portal/portal.vertex.glsl';

// Sky
import SkyFlatFragment      from './sky/skyFlat.fragment.glsl';
import SkyFlatVertex        from './sky/skyFlat.vertex.glsl';
import SkyCubeFragment      from './sky/skyCube.fragment.glsl';
import SkyCubeVertex        from './sky/skyCube.vertex.glsl';

// Water
import WaterFragment        from './water/water.fragment.glsl';
import WaterVertex          from './water/water.vertex.glsl';
import OceanFragment        from './water/ocean.fragment.glsl';
import OceanVertex          from './water/ocean.vertex.glsl';

// Post-proc
import BloomSelectiveFragment   from './postprocessing/bloom.selective.fragment.glsl';
import BloomSelectiveVertex     from './postprocessing/bloom.selective.vertex.glsl';

let ShadersModule = {

    // Portal
    getPortalVertexShader() {
        return PortalVertex;
    },

    getPortalFragmentShader() {
        return PortalFragment;
    },

    // Sky
    getSkyCubeVertexShader() {
        return SkyCubeVertex;
    },

    getSkyCubeFragmentShader() {
        return SkyCubeFragment;
    },

    getSkyFlatVertexShader() {
        return SkyFlatVertex;
    },

    getSkyFlatFragmentShader() {
        return SkyFlatFragment;
    },

    // Water
    getWaterFragmentShader() {
        return `
            #include <common>
            ${WaterFragment}
        `;
    },

    getWaterVertexShader() {
        return `
            #include <common>
            ${WaterVertex}
        `;
    },

    getOceanFragmentShader() {
        return `
            #include <common>
            ${OceanFragment}
        `;
    },

    getOceanVertexShader() {
        return `
            #include <common>
            ${OceanVertex}
        `;
    },

    // Post-proc
    getBloomSelectiveVertexShader() {
        return BloomSelectiveVertex;
    },

    getBloomSelectiveFragmentShader() {
        return BloomSelectiveFragment;
    }

};

export { ShadersModule };
