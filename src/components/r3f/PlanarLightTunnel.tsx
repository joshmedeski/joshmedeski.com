import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'

const vertexShader = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  precision highp float;

  uniform float iTime;
  uniform vec2  iResolution;

  uniform float _BandSpacing;
  uniform float _FrequencyY;
  uniform float _SpeedZ;
  uniform float _RandomSpeed;
  uniform float _FrequencyZ;

  out vec4 fragColor;

  vec3 hash31(float p)
  {
     vec3 p3 = fract(p * vec3(.1031, .1030, .0973));
     p3 += dot(p3, p3.yzx+19.19);
     return fract((p3.xxy+p3.yzz)*p3.zyx);
  }

  vec3 spectrum(in float d)
  {
      return smoothstep(0.25, 0., abs(d + vec3(0.125,0.,-0.125)));
  }

  void main() {
    vec3 color = vec3(0.);
    float z = iTime * _SpeedZ;

    float zOffset = z * _RandomSpeed;
    vec2 uv = gl_FragCoord.xy/iResolution - 0.5;
    uv.x *= iResolution.x / iResolution.y;

    vec3 ray = normalize(vec3(uv.yx, 1.5));
    float l = length(ray.xy);
    float r = 1.;
    for(int i = 0; i < 4; i++){
        vec3 hit = (ray / abs(ray.x)) * r++;
        vec3 p = hit;
        p.z += z;

        float seed = p.x * 7. + p.y + 5.;

        //give bands uneven width
        p.y += sin(seed * 5.) * _BandSpacing;
        seed = (p.x + p.y) * _FrequencyY;

        vec3 rand = hash31(floor(seed));

        //z animation
        p.z += (rand.x - 0.5) *-zOffset;

        //frequency in z
        p.z *=	_FrequencyZ / (rand.y + 0.05);

        vec2 cell = fract(vec2(seed, p.z)) - 0.5;

        float b = rand.y;
        b *= smoothstep(0.5, 0., abs(cell.x));
        b *= smoothstep(50., 10., length(hit));
        b *= smoothstep(5., 2., abs(hit.y));
        color += spectrum(cell.y) * b;
    }

    color = sqrt(color);
    color *= 1.3 - dot(uv, uv);
    fragColor = vec4(color,1.0);
  }
`

function ShaderPlane() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { viewport, size } = useThree()

  const { BandSpacing, FrequencyY, SpeedZ, RandomSpeed, FrequencyZ } =
    useControls({
      BandSpacing: { value: 0.5, min: 0, max: 1, step: 0.01 },
      FrequencyY: { value: 2.0, min: 0.1, max: 4, step: 0.01 },
      SpeedZ: { value: 4.0, min: 0, max: 32, step: 0.01 },
      RandomSpeed: { value: 3.0, min: 0, max: 8, step: 0.01 },
      FrequencyZ: { value: 0.03, min: 0.001, max: 0.1, step: 0.01 },
    })

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(size.width, size.height) },
      _BandSpacing: { value: BandSpacing },
      _FrequencyY: { value: FrequencyY },
      _SpeedZ: { value: SpeedZ },
      _RandomSpeed: { value: RandomSpeed },
      _FrequencyZ: { value: FrequencyZ },
    }),
    [],
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.iTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.iResolution.value.set(
        state.size.width,
        state.size.height,
      )
      materialRef.current.uniforms._BandSpacing.value = BandSpacing
      materialRef.current.uniforms._FrequencyY.value = FrequencyY
      materialRef.current.uniforms._SpeedZ.value = SpeedZ
      materialRef.current.uniforms._RandomSpeed.value = RandomSpeed
      materialRef.current.uniforms._FrequencyZ.value = FrequencyZ
    }
  })

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        glslVersion={THREE.GLSL3}
      />
    </mesh>
  )
}

export default function Experience() {
  return (
    <section className="w-full aspect-video">
      <Canvas>
        <ShaderPlane />
      </Canvas>
    </section>
  )
}
