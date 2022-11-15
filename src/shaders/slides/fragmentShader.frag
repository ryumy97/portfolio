varying vec2 vUv;

uniform sampler2D u_texture;
uniform float u_ratio;

void main() {
    float u = vUv.x; // / u_ratio - (0.5 - (1.0 * u_ratio) * 0.5) / u_ratio;
    float v = vUv.y * u_ratio - (0.5 - (1.0 / u_ratio) * 0.5) * u_ratio;

    vec3 col = texture2D(u_texture, vec2(u, v)).rgb;
                    
    col = mix(col, vec3(1.0), step(0.5, abs(v - 0.5)));
                    
    gl_FragColor = vec4(col, 1.0);
}
