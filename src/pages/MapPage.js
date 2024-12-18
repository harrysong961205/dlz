// src/pages/MapPage.js
import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Points, PointMaterial, Plane, OrbitControls, Html } from '@react-three/drei';
import { TextureLoader } from 'three';

// JSON 파일 import
import philosophicalData from '../data/philosophical.json';

// Network 컴포넌트 상단에 easing 함수 추가
const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

function Network({ onNodeSelect, selectedNode }) {
  const [positions, setPositions] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, z: 0 });
  const [colorTransitions, setColorTransitions] = useState([]);
  const colorTransitionRef = useRef([]);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentMouseEvent, setCurrentMouseEvent] = useState(null);

  const { points, connections } = useMemo(() => {
    const pts = [];
    const conns = [];
    const nodes = philosophicalData.nodes;
    const edges = philosophicalData.edges;
    
    // 
    const SPREAD = 10;
    const CLUSTER_FACTOR = 0.7;
    
    // 먼저 모든 노드의 초기 위치 설정
    nodes.forEach(() => {
      const phi = Math.acos(2 * Math.random() - 1) * CLUSTER_FACTOR;
      const theta = Math.random() * Math.PI * 2;
      const radius = SPREAD * (0.3 + Math.random() * 0.7);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      pts.push(new THREE.Vector3(x, y, z));
    });

    // 연결 정��� 설정
    edges.forEach(edge => {
      const sourceIndex = nodes.findIndex(n => n.id === edge.source);
      const targetIndex = nodes.findIndex(n => n.id === edge.target);
      if (sourceIndex !== -1 && targetIndex !== -1) {
        conns.push([sourceIndex, targetIndex]);
      }
    });

    // 힘 기반 레이아웃 파라미터 조정
    const REPULSION = 15;        // 반발력 더 감소
    const ATTRACTION = 0.05;     // 연결된 노드 간 인력 증가
    const MIN_DISTANCE = 3;      // 최소 거리 더 감소
    const CENTER_GRAVITY = 0.001; // 중심 인력 감소

    // 힘 기반 레이아웃 계산
    for (let iteration = 0; iteration < 300; iteration++) { // 반복 횟수 증가
      const forces = pts.map(() => new THREE.Vector3(0, 0, 0));

      // 모든 노드 쌍에 대한 반발력
      nodes.forEach((_, i) => {
        nodes.forEach((_, j) => {
          if (i !== j) {
            const force = new THREE.Vector3();
            force.subVectors(pts[i], pts[j]);
            const distance = force.length() || 0.1;
            
            if (distance < MIN_DISTANCE * 3) {
              force.normalize().multiplyScalar(REPULSION / (distance * distance));
              forces[i].add(force);
            }
          }
        });

        // 연결된 노드들 간의 강한 인력
        conns.forEach(([source, target]) => {
          if (i === source || i === target) {
            const other = i === source ? target : source;
            const force = new THREE.Vector3();
            force.subVectors(pts[other], pts[i]);
            const distance = force.length();
            force.normalize().multiplyScalar(distance * ATTRACTION);
            forces[i].add(force);
          }
        });

        // 중심력 계산
        const toCenter = pts[i].clone().negate();
        const distanceToCenter = toCenter.length();
        toCenter.normalize().multiplyScalar(distanceToCenter * CENTER_GRAVITY);
        forces[i].add(toCenter);
      });

      // 위치 업데이트
      nodes.forEach((_, i) => {
        pts[i].add(forces[i].multiplyScalar(0.1));
      });
    }

    setPositions(pts.map(p => ({ x: p.x, y: p.y, z: p.z })));
    
    return { points: pts, connections: conns };
  }, []);

  const randomOffsets = useMemo(() => {
    return points.map(() => ({
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2,
      speedX: (0.1 + Math.random() * 0.2) * 1.5,
      speedY: (0.1 + Math.random() * 0.2) * 1.5,
      speedZ: (0.1 + Math.random() * 0.2) * 1.5
    }));
  }, [points]);

  const texture = useMemo(() => {
    const loader = new TextureLoader();
    return loader.load('/assets/images/elon-musk.jpg');
  }, []);

  useFrame((state) => {
    if (points.length === 0 || positions.length === 0) return;
    
    const time = state.clock.getElapsedTime();
    
    const newPositions = points.map((point, idx) => {
      const offset = randomOffsets[idx];
      return {
        x: point.x + Math.sin(time * offset.speedX + offset.x) * 0.3,
        y: point.y + Math.cos(time * offset.speedY + offset.y) * 0.3,
        z: point.z + Math.sin(time * offset.speedX + offset.y) * 0.3  // z축도 움직임 추가
      };
    });
    
    setPositions(newPositions);
  });

  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  const updateMousePosition = useCallback((event) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    // 화면상의 2D 좌표를 NDC로 변환
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 현재 카메라 위치에서 레이캐스팅
    raycaster.setFromCamera(mouse, camera);
    
    // 가상의 평면 생성 (카메라가 바라보는 방향에 수직인 평면)
    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);
    const plane = new THREE.Plane(planeNormal, 0);
    
    // 레이와 평면의 교차점 계산
    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, intersection)) {
      // 교차점이 있을 경우에만 마우스 위치 업데이트
      setMousePosition(intersection);
    }
  }, [camera]);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('mousemove', updateMousePosition);
      return () => canvas.removeEventListener('mousemove', updateMousePosition);
    }
  }, [updateMousePosition]);

  // 색상 전환 상태 초기화
  useEffect(() => {
    if (selectedNode) {
      const newTransitions = positions.map((_, idx) => ({
        isSelected: philosophicalData.nodes[idx].id === selectedNode.id,
        isConnected: philosophicalData.edges.some(edge => 
          (edge.source === philosophicalData.nodes[idx].id && edge.target === selectedNode.id) ||
          (edge.target === philosophicalData.nodes[idx].id && edge.source === selectedNode.id)
        )
      }));
      setColorTransitions(newTransitions);
      colorTransitionRef.current = newTransitions;
    } else {
      setColorTransitions(positions.map(() => ({
        isSelected: false,
        isConnected: false
      })));
      colorTransitionRef.current = positions.map(() => ({
        isSelected: false,
        isConnected: false
      }));
    }
  }, [selectedNode, positions]);

  // 색상 전환 애니메이션
  useFrame(() => {
    if (selectedNode) {
      let needsUpdate = false;
      const newTransitions = colorTransitionRef.current.map((transition, idx) => {
        if (transition.progress < 1) {
          needsUpdate = true;
          return {
            ...transition,
            progress: Math.min(1, transition.progress + 0.02)
          };
        }
        return transition;
      });

      if (needsUpdate) {
        colorTransitionRef.current = newTransitions;
        setColorTransitions(newTransitions);
      }
    }
  });

  // 마우스 이벤트 핸들러
  const handleMouseDown = (event) => {
    // 드나 엣지를 클릭한 게 아닐 때 드래그 시작
    if (event.target.nodeName === 'CANVAS') {
      setIsDragging(true);
      setDragStart({
        x: event.clientX - cameraPosition.x,
        y: event.clientY - cameraPosition.y
      });
    }
  };

  const handleMouseMove = useCallback((event) => {
    setCurrentMouseEvent(event);  // 현재 마우스 이벤트 저장
    if (isDragging) {
      setCameraPosition({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 이벤트 리스너 등록
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, handleMouseDown, handleMouseMove, handleMouseUp]);

  // 노드 리 계산 함수 수정
  const calculateScreenDistance = useCallback((nodePosition, mouseEvent) => {
    if (!mouseEvent) return Infinity;  // 마우스 이벤트가 없으면 큰 값 반환

    const nodeVector = new THREE.Vector3(nodePosition.x, nodePosition.y, nodePosition.z);
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    
    nodeVector.project(camera);
    
    const nodeScreen = {
      x: (nodeVector.x * widthHalf) + widthHalf,
      y: -(nodeVector.y * heightHalf) + heightHalf
    };
    
    return Math.sqrt(
      Math.pow(nodeScreen.x - mouseEvent.clientX, 2) + 
      Math.pow(nodeScreen.y - mouseEvent.clientY, 2)
    );
  }, [camera]);

  // 현재와 이전 선택 상태를 모두 관리
  const [previousSelectedNode, setPreviousSelectedNode] = useState(null);
  const animationProgress = useRef(0);
  const [animating, setAnimating] = useState(false);
  const nodeStates = useRef(new Map()); // 현재 노드 상태를 저장할 ref

  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  // 노드 선택 시 처리
  useEffect(() => {
    if (selectedNode !== previousSelectedNode) {
      // 현재 상태 저장
      positions.forEach((_, idx) => {
        const nodeId = philosophicalData.nodes[idx].id;
        if (!nodeStates.current.has(nodeId)) {
          nodeStates.current.set(nodeId, {
            size: 0.2,
            opacity: 0.3,
            emissive: 0.3
          });
        }
      });

      setPreviousSelectedNode(selectedNode);
      animationProgress.current = 0;
      setAnimating(true);
    }
  }, [selectedNode, previousSelectedNode, positions]);

  // 애니메이션 프레임 처리
  useFrame((state, delta) => {
    if (animating) {
      animationProgress.current += delta * 0.8; // 애니메이션 속도 조절 (숫자가 작을수록 느림)
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        setAnimating(false);
      }
    }
  });

  // 선택 해제 상태 관리
  const [isDeselecting, setIsDeselecting] = useState(false);
  const deselectProgress = useRef(0);

  // 선택 해제 핸들러 수정
  const handleBackgroundClick = useCallback((event) => {
    if (event.delta > 2) return;
    
    if (event.object.type === 'Mesh' && !event.object.userData.isNode) {
      setIsDeselecting(true);
      deselectProgress.current = 0;
      setTimeout(() => {
        onNodeSelect(null);
        setIsDeselecting(false);
      }, 300);
    }
  }, [onNodeSelect]);

  // 애니메이션 프레임 처리
  useFrame((state, delta) => {
    if (isDeselecting) {
      deselectProgress.current = Math.min(1, deselectProgress.current + delta * 3);
    }
  });

  // 렌더링 부분
  return (
    <group position={[cameraPosition.x / 100, -cameraPosition.y / 100, 0]}>
      <mesh
        position={[0, 0, -20]} // 더 뒤쪽으로 이동
        onClick={handleBackgroundClick}
        userData={{ isBackground: true }} // 배경 평면임을 표시
      >
        <planeGeometry args={[2000, 2000]} /> {/* 더 큰 크기로 변경 */}
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {connections.map(([i, j], idx) => {
        const start = positions[i];
        const end = positions[j];
        
        if (!start || !end) return null;
        
        const isSelectedEdge = selectedNode && (
          philosophicalData.nodes[i].id === selectedNode.id ||
          philosophicalData.nodes[j].id === selectedNode.id
        );
        
        const progress = easeInOutSine(animationProgress.current);
        
        // edge의 opacity와 width도 일한 easing 적용
        const opacity = isSelectedEdge ? 0.1 + (0.7 * progress) : 0.2;
        const lineWidth = isSelectedEdge ? 0.5 + (1.5 * progress) : 0.5;

        return (
          <Line
            key={idx}
            points={[[start.x, start.y, start.z], [end.x, end.y, end.z]]}
            color="#00ff9d"
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
          />
        );
      })}

      {positions.map((pos, idx) => {
        const nodeId = philosophicalData.nodes[idx].id;
        const currentState = nodeStates.current.get(nodeId) || {
          size: 0.2,
          opacity: 0.3,
          emissive: 0.3
        };

        const transition = colorTransitions[idx] || { isSelected: false, isConnected: false };
        const progress = easeInOutSine(animationProgress.current); // 동일한 progress 사용
        
        // 목표 상태 계산
        const targetState = {
          size: transition.isSelected ? 0.8 : 
                transition.isConnected ? 0.5 : 
                0.2,
          opacity: transition.isSelected ? 1.0 :
                  transition.isConnected ? 0.9 :
                  0.3,
          emissive: transition.isSelected ? 2.0 :
                   transition.isConnected ? 1.0 :
                   0.3
        };

        // 모든 속성에 동일한 progress 적용
        const currentSize = currentState.size + ((targetState.size - currentState.size) * progress);
        const currentOpacity = currentState.opacity + ((targetState.opacity - currentState.opacity) * progress);
        const currentEmissive = currentState.emissive + ((targetState.emissive - currentState.emissive) * progress);

        // 현재 상태 업데이트
        nodeStates.current.set(nodeId, {
          size: currentSize,
          opacity: currentOpacity,
          emissive: currentEmissive
        });

        return (
          <group key={`node-group-${idx}`}>
            <mesh
              position={[pos.x, pos.y, pos.z]}
              onClick={(e) => {
                e.stopPropagation();
                onNodeSelect(philosophicalData.nodes[idx]);
              }}
              userData={{ isNode: true }} // 노드임을 표시
            >
              <sphereGeometry args={[currentSize, 32, 32]} />
              <meshStandardMaterial
                color="#00ff9d"
                transparent
                opacity={currentOpacity}
                emissive="#00ff9d"
                emissiveIntensity={currentEmissive}
              />
            </mesh>
            <Html
              position={[pos.x, pos.y - 0.4, pos.z]}
              center
              style={{
                color: '#00ff9d',
                fontSize: '12px',
                fontFamily: 'Arial',
                textShadow: '0 0 3px rgba(0,255,157,0.5)',
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                opacity: (() => {
                  const distance = new THREE.Vector3(pos.x, pos.y, pos.z)
                    .distanceTo(camera.position);
                  
                  let baseOpacity;
                  if (selectedNode) {
                    if (transition.isSelected) baseOpacity = 1;
                    else if (transition.isConnected) baseOpacity = 0.9;
                    else baseOpacity = 0.2;
                  } else {
                    if (isDeselecting) {
                      // 선택 해제 시 반대 방향 easing
                      const progress = easeOutExpo(1 - deselectProgress.current);
                      if (transition.isSelected || transition.isConnected) {
                        // 이전에 선택되었거나 연결된 노드는 1.0/0.9에서 0.7로
                        baseOpacity = 0.7 + ((transition.isSelected ? 0.3 : 0.2) * progress);
                      } else {
                        // 이전에 선택되지 않은 노드는 0.2에서 0.7로
                        baseOpacity = 0.2 + (0.5 * (1 - progress));
                      }
                    } else {
                      baseOpacity = 0.7;
                    }
                  }
                  
                  if (distance > 50) return 0;
                  if (distance < 30) return baseOpacity;
                  
                  const fadeStart = 30;
                  const fadeEnd = 50;
                  const fadeOpacity = 1 - (distance - fadeStart) / (fadeEnd - fadeStart);
                  return fadeOpacity * baseOpacity;
                })(),
                fontWeight: transition.isSelected ? 'bold' : 'normal',
                zIndex: transition.isSelected ? 1 : 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '2px 4px',
                borderRadius: '3px',
              }}
            >
              {philosophicalData.nodes[idx].label}
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function MapPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'black', 
      position: 'relative',
    }}>
      <Canvas
        camera={{ 
          position: [30, 30, 30],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{ background: '#000000' }}
      >
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={100}
          makeDefault
          target={[0, 0, 0]}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
          rotateSpeed={0.5}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
        />
        <Network onNodeSelect={setSelectedNode} selectedNode={selectedNode} />
      </Canvas>
      
      {selectedNode && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '300px',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: '20px',
          color: '#00ff9d',
          boxShadow: '-5px 0 15px rgba(0, 255, 157, 0.1)',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                background: 'none',
                border: 'none',
                color: '#00ff9d',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '10px'
              }}
            >
              ×
            </button>
            <h2 style={{ marginBottom: '20px', fontWeight: 'normal' }}>
              {selectedNode.label}
            </h2>
            <p style={{ marginBottom: '20px' }}>
              {selectedNode.description}
            </p>
            <h3>관련 개념</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {philosophicalData.edges
                .filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id)
                .map((edge, idx) => {
                  const relatedNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                  const relatedNode = philosophicalData.nodes.find(n => n.id === relatedNodeId);
                  
                  return (
                    <li key={idx} style={{ marginBottom: '10px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#00ff9d'
                      }}>
                        {edge.source === selectedNode.id ? (
                          <>
                            <span>{edge.relation} → </span>
                            <button
                              onClick={() => setSelectedNode(relatedNode)}
                              style={{
                                background: 'none',
                                border: '1px solid #00ff9d',
                                borderRadius: '4px',
                                color: '#00ff9d',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                ':hover': {
                                  backgroundColor: 'rgba(0, 255, 157, 0.1)'
                                }
                              }}
                            >
                              {relatedNode.label}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedNode(relatedNode)}
                              style={{
                                background: 'none',
                                border: '1px solid #00ff9d',
                                borderRadius: '4px',
                                color: '#00ff9d',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                ':hover': {
                                  backgroundColor: 'rgba(0, 255, 157, 0.1)'
                                }
                              }}
                            >
                              {relatedNode.label}
                            </button>
                            <span>→ {edge.relation}</span>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapPage;