uniform sampler2D texture1;

varying vec4 pos_frag;

void main() {

   vec2 ratio = pos_frag.xy / pos_frag.w;
   vec2 correctedUv = (ratio + vec2(1.0)) * 0.5;

   gl_FragColor = texture2D(texture1, correctedUv);
}
