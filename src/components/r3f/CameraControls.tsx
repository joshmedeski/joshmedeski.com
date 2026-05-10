import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface CameraControlsProps {
  enable?: boolean
  damping?: number
  rotationSpeed?: number
  panSpeed?: number
  zoomSpeed?: number
  minDistance?: number
  maxDistance?: number
  initialDistance?: number
}

export default function CameraControls({
  enable = true,
  damping = 0.1,
  rotationSpeed = 0.005,
  panSpeed = 0.005,
  zoomSpeed = 0.1,
  minDistance = 1,
  maxDistance = 100,
  initialDistance = 5,
}: CameraControlsProps) {
  const { camera, gl } = useThree()
  const mouseRef = useRef({ x: 0, y: 0, isDown: false })
  const targetRef = useRef(new THREE.Vector3())
  const rotationRef = useRef({ x: 0, y: 0 })
  const distanceRef = useRef(initialDistance)

  const [
    {
      zoomSpeed: levaZoomSpeed,
      minDistance: levaMinDistance,
      maxDistance: levaMaxDistance,
      distance: levaDistance,
    },
    set,
  ] = useControls(
    'Camera Zoom',
    () => ({
      zoomSpeed: { value: zoomSpeed, min: 0.001, max: 1, step: 0.001 },
      minDistance: { value: minDistance, min: 0.1, max: 100, step: 0.1 },
      maxDistance: { value: maxDistance, min: 1, max: 500, step: 1 },
      distance: {
        value: initialDistance,
        min: -2,
        max: 20,
        step: 0.1,
        label: 'Zoom Level',
      },
    }),
    [zoomSpeed, minDistance, maxDistance, initialDistance],
  )

  useEffect(() => {
    distanceRef.current = levaDistance
  }, [levaDistance])

  useEffect(() => {
    if (!enable) return

    const handleMouseDown = (event: MouseEvent) => {
      mouseRef.current.isDown = true
      mouseRef.current.x = event.clientX
      mouseRef.current.y = event.clientY
    }

    const handleMouseUp = () => {
      mouseRef.current.isDown = false
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseRef.current.isDown) return

      const deltaX = event.clientX - mouseRef.current.x
      const deltaY = event.clientY - mouseRef.current.y

      if (event.shiftKey) {
        // Pan camera
        const panX = deltaX * panSpeed * distanceRef.current
        const panY = deltaY * panSpeed * distanceRef.current

        const right = new THREE.Vector3()
        const up = new THREE.Vector3()

        camera.matrix.extractBasis(right, up, new THREE.Vector3())

        right.multiplyScalar(-panX)
        up.multiplyScalar(panY)

        targetRef.current.add(right).add(up)
      } else {
        // Rotate camera
        rotationRef.current.x += deltaY * rotationSpeed
        rotationRef.current.y += deltaX * rotationSpeed

        // Clamp vertical rotation
        rotationRef.current.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, rotationRef.current.x),
        )
      }

      mouseRef.current.x = event.clientX
      mouseRef.current.y = event.clientY
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()

      const delta = event.deltaY * levaZoomSpeed * 0.01
      const newDistance = Math.max(
        levaMinDistance,
        Math.min(levaMaxDistance, distanceRef.current + delta),
      )
      distanceRef.current = newDistance
      set({ distance: newDistance })
    }

    const updateCamera = () => {
      // Calculate camera position based on spherical coordinates
      const x =
        targetRef.current.x +
        distanceRef.current *
          Math.sin(rotationRef.current.y) *
          Math.cos(rotationRef.current.x)
      const y =
        targetRef.current.y +
        distanceRef.current * Math.sin(rotationRef.current.x)
      const z =
        targetRef.current.z +
        distanceRef.current *
          Math.cos(rotationRef.current.y) *
          Math.cos(rotationRef.current.x)

      // Smooth camera movement
      camera.position.x += (x - camera.position.x) * damping
      camera.position.y += (y - camera.position.y) * damping
      camera.position.z += (z - camera.position.z) * damping

      camera.lookAt(targetRef.current)

      requestAnimationFrame(updateCamera)
    }

    const canvas = gl.domElement
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('wheel', handleWheel)

    canvas.style.cursor = mouseRef.current.isDown ? 'grabbing' : 'grab'

    updateCamera()

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [
    enable,
    camera,
    gl,
    damping,
    rotationSpeed,
    panSpeed,
    levaZoomSpeed,
    levaMinDistance,
    levaMaxDistance,
    set, // Added set to dependency array
  ])

  return null
}
