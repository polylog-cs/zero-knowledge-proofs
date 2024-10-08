#version 300 es
precision highp float;

#include "@motion-canvas/core/shaders/common.glsl"

uniform vec4 mixColor;
uniform float mixStrength;
uniform float offset;

void main() {
    // Sample the texture
    outColor = texture(sourceTexture, sourceUV);

    float x = sourceUV.x;
    float y = sourceUV.y * 0.25;

    // Calculate distance from the center (0.5, 0.5)
    float dist = distance(vec2(x, y), vec2(0.5, offset));

    // We want a stronger mix near the center, so we can invert the distance.
    // Clamp the distance to 0.0 to 1.0 range for more control.
    float mixFactor = 1.0 - clamp(dist * 2.0, 0.0, 1.0); // Multiply distance by 2 to make the effect sharper

    mixFactor *= mixStrength;

    // Mix the sampled texture color with the mixColor, based on the mixFactor
    outColor.rgb = mix(outColor.rgb, mixColor.rgb, mixFactor);
}
