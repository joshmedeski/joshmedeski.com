import { Canvas } from '@react-three/fiber'
import CameraControls from './CameraControls'

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* A simple cube to look at */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      {/* Additional objects for better perspective */}
      <mesh position={[3, 0, 0]}>
        <sphereGeometry args={[1]} />
        <meshStandardMaterial color="blue" />
      </mesh>

      <mesh position={[-3, 0, 0]}>
        <coneGeometry args={[1, 2]} />
        <meshStandardMaterial color="green" />
      </mesh>

      <mesh position={[0, 3, 0]}>
        <torusGeometry args={[1, 0.4]} />
        <meshStandardMaterial color="purple" />
      </mesh>

      {/* Grid for spatial reference */}
      <gridHelper args={[20, 20]} />

      <CameraControls />
    </>
  )
}

export default function CameraDemo() {
  return (
    <div className="relative w-full aspect-video">
      <Canvas
        camera={{
          position: [5, 5, 5],
          fov: 60,
        }}
        className="bg-gray-900"
      >
        <Scene />
      </Canvas>

      <div className="absolute top-4 left-4 bg-black/50 text-white p-4 rounded-lg text-sm">
        <h3 className="font-bold mb-2">Camera Controls:</h3>
        <ul className="space-y-1">
          <li>🖱️ Click & drag to rotate</li>
          <li>⇧ Shift + drag to pan</li>
          <li>🎯 Scroll to zoom</li>
        </ul>
      </div>
    </div>
  )
}
