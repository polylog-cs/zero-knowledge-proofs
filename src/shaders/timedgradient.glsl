#version 300 es
precision highp float;

#include "@motion-canvas/core/shaders/common.glsl"

uniform float t;
uniform float gradientWidth;
uniform float strokeWidth;

float isBorder(float _r) {
  float min_a = 1., max_a = 0.;
  vec2 resolution = vec2(textureSize(sourceTexture, 0));
  float r = _r;
  int ndirs = 64;
  for (int it = 0; it < 5; it++) {
    for (int i = 0; i < ndirs; i++) {
      float angle = radians(float(i) * 360. / float(ndirs));
      vec2 d = vec2(r * cos(angle), r * sin(angle)) / resolution;
      float a = texture(sourceTexture, sourceUV + d).a;
      min_a = min(min_a, a);
      max_a = max(max_a, a);
    }
    r *= 0.8;
  }
  return max_a - min_a;
}

float alphaFromT(float t) {
  float _t = t * (1. + gradientWidth);
  float alpha = (sourceUV.x - (_t - gradientWidth)) / gradientWidth;
  return 1. - clamp(alpha, 0., 1.);
}

void main() {
  float _t = t * (1. + gradientWidth / 2.);
  outColor = texture(sourceTexture, sourceUV);
  float strokeAmount = isBorder(strokeWidth);
  float stroke_a = strokeAmount * alphaFromT(_t);
  float fill_a = (1. - strokeAmount) * alphaFromT(_t - gradientWidth / 2.);
  outColor.a *= stroke_a + fill_a;
}
