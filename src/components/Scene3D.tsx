import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles() {
  const ref = useRef<THREE.Points>(null!);
  const count = 1500;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.015;
      ref.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffcc00"
        size={0.04}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Error boundary for Three.js
class ThreeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

export const Scene3D: React.FC = () => {
  return (
    <ThreeErrorBoundary>
      <div className="three-bg">
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]}>
            <ambientLight intensity={0.5} />
            <Particles />
          </Canvas>
        </Suspense>
      </div>
    </ThreeErrorBoundary>
  );
};

export const HeroScene: React.FC = () => {
  return (
    <ThreeErrorBoundary>
      <div className="hero-canvas">
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]}>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffcc00" />
            <Particles />
          </Canvas>
        </Suspense>
      </div>
    </ThreeErrorBoundary>
  );
};
