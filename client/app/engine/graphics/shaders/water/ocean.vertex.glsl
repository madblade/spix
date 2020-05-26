
uniform mat4 textureMatrix;
uniform float time;

varying vec4 mirrorCoord;
varying vec4 worldPosition;

varying vec3 vvnormal;
//#include <common>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>

// Ref. in GPU Gems 1
// https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models
vec3 gerstnerPositions(float x, float y) {
    float ox = x;
    float oy = y;
    float oz = 0.0;
    const int nbWaves = 1;
    for (int i = 0; i < nbWaves; i++) {
        float frequencyI = 0.05; // wi
        float amplitudeI = 20.0; // Ai
        float steepnessI = 1.0 / (frequencyI * amplitudeI); // Qi from 0 to 1/wiAi
        vec2 directionI = normalize(vec2(1.0, 0.0));
        float phaseI = 1.0; // phiI
        ox += steepnessI * amplitudeI * directionI.x * cos(frequencyI * dot(directionI, vec2(x, y)) + phaseI * time);
        oy += steepnessI * amplitudeI * directionI.y * cos(frequencyI * dot(directionI, vec2(x, y)) + phaseI * time);
        oz += amplitudeI * sin(frequencyI * dot(directionI, vec2(x, y)) + phaseI * time);
    }
    return vec3(ox, oy, oz);
}

vec3 gerstnerNormals(float x, float y, vec3 p) {
    float nx = 0.0;
    float ny = 0.0;
    float nz = 1.0;
    const int nbWaves = 1;
    for (int i = 0; i < nbWaves; i++) {
        float frequencyI = 0.05; // wi
        float amplitudeI = 20.0; // Ai
        float steepnessI = 1.0 / (frequencyI * amplitudeI); // Qi from 0 to 1/wiAi
        vec2 directionI = normalize(vec2(1.0, 0.0));
        float phaseI = 1.0; // phiI
        nx -= (directionI.x * frequencyI * amplitudeI * cos(frequencyI * dot(vec3(directionI, 0.0), p) + phaseI * time) );
        ny -= (directionI.y * frequencyI * amplitudeI * cos(frequencyI * dot(vec3(directionI, 0.0), p) + phaseI * time) );
        nz -= (steepnessI * frequencyI * amplitudeI * sin(frequencyI * dot(vec3(directionI, 0.0), p) + phaseI * time) );

    }
    return vec3(nx, ny, nz);
}

void main()
{
    mirrorCoord = modelMatrix * vec4( position, 1.0 );
    worldPosition = mirrorCoord.xyzw;
    mirrorCoord = textureMatrix * mirrorCoord;
    vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );

    // this is how to use gerstner
    vec3 newPo = gerstnerPositions(position.x, position.y);
    vec3 gn = gerstnerNormals(position.x, position.y, newPo);
    vvnormal = normalMatrix * gn;
    mvPosition = modelViewMatrix * vec4(newPo.x, newPo.y, newPo.z, 1.0);

    gl_Position = projectionMatrix * mvPosition;

    #include <logdepthbuf_vertex>
    #include <fog_vertex>
    #include <shadowmap_vertex>
}
