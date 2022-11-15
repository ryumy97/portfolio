varying vec2 vUv;

uniform sampler2D u_texture;

uniform vec2 u_viewport;
uniform vec2 u_image_size;
uniform vec2 u_window_size;

uniform vec2 u_object_fit;
uniform float u_progress;

vec2 getScaledUV() {

    float viewportRatio = u_viewport.y / u_viewport.x;
    float imageRatio = u_image_size.y / u_image_size.x;

    float v;
    float u;

    if (viewportRatio > imageRatio) {
        float a = u_image_size.x / u_image_size.y;
        float b = u_viewport.x / u_viewport.y;

        v = vUv.y;
        u = vUv.x / viewportRatio * imageRatio + u_object_fit.x / a * (a - b);
    }
    else {
        v = vUv.y * viewportRatio / imageRatio + u_object_fit.y / imageRatio * (imageRatio - viewportRatio);
        u = vUv.x;
    }

    return vec2(u,v);
}

void main() {
    vec2 uv = getScaledUV();

    gl_FragColor = vec4(texture2D(u_texture, uv).rgb, 1.0);
}
