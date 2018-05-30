attribute vec3 sampleDir;

varying vec3 vDir;
varying vec2 vUv;

void main()
{
    vUv = uv;
    vDir = sampleDir;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
