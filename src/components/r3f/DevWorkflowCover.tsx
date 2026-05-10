import { OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { SplatMesh } from '@sparkjsdev/spark'
import { useEffect, useMemo } from 'react'
import CameraControls from './CameraControls'

function SplatScene() {
  const mesh = useMemo(() => {
    const url = '/dev-workflow-guide-cover.ply'
    // @ts-ignore - SplatMesh types might not be fully compatible with Three types in strict mode
    const splat = new SplatMesh({ url })
    return splat
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup if needed, though primitive handles scene removal
      // @ts-ignore
      mesh.dispose?.()
    }
  }, [mesh])

  return (
    <primitive object={mesh} position={[0, 0, 0]} quaternion={[1, 0, 0, 0]} />
  )
}

export default function DevWorkflowCover() {
  return (
    <div className="relative w-full aspect-video">
      <Canvas gl={{ antialias: true }}>
        <OrthographicCamera />
        <CameraControls minDistance={0.01} initialDistance={2} />
        <SplatScene />
      </Canvas>
    </div>
  )
}
