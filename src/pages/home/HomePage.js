import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './HomePage.css';
import * as d3 from 'd3';
import philosopherData from '../../data/philosopherData.json';
import NietzscheImage from '../../assets/images/nietzsche.png';  // 이미지 경로는 실제 위치에 맞게 조정해주세요

function HomePage() {
  const initialPhilosopher = Object.keys(philosopherData)[0];
  const [selectedPhilosopher, setSelectedPhilosopher] = useState({ name: initialPhilosopher });
  const [selectedNode, setSelectedNode] = useState(null);

  // 초기 줌 레벨 설정을 위한 ref
  const fgRef = useRef();

  // 배경 이미지 상태 추가
  const [backgroundImage, setBackgroundImage] = useState(null);

  // 이미지 로드
  useEffect(() => {
    console.log("이미지 로드 시작");
    const image = new Image();
    image.src = NietzscheImage;
    
    // 이미지 로드 에러 처리 추가
    image.onerror = (e) => {
      console.error("이미지 로드 실패:", e);
      console.log("시도한 이미지 경로:", NietzscheImage);
    };
    
    image.onload = () => {
      console.log("이미지 로드 성공");
      console.log("이미지 크기:", image.width, "x", image.height);
      setBackgroundImage(image);
    };
  }, []);

  // createNodes 함수를 useMemo 위로 이동하고 useCallback으로 메모이제이션
  const createNodes = useCallback(() => {
    const philosopher = philosopherData[selectedPhilosopher.name];
    if (!philosopher) return [];

    return [
      // 중심 노드 크기 조절
      {
        ...philosopher.info,
        size: 15,  // 25에서 15로 크기 감소
        fx: 0,
        fy: 0
      },
      // 주요 개념들
      ...philosopher.concepts.mainConcepts.map(node => ({
        ...node,
        group: 2,
        size: 5,
        color: '#29b6f6'
      })),
      // 부차 개념들
      ...philosopher.concepts.subConcepts.map(node => ({
        ...node,
        group: 3,
        size: 4,
        color: '#66bb6a'
      })),
      // 관련 개념들
      ...philosopher.concepts.relatedConcepts.map(node => ({
        ...node,
        group: 4,
        size: 3,
        color: '#ba68c8'
      }))
    ];
  }, [selectedPhilosopher]);

  // createLinks 함수도 useCallback으로 메모이제이션
  const createLinks = useCallback((nodes) => {
    const links = [];
    const centerNode = nodes[0]; // 니체 노드

    // 중심 노드와 주요 개념들 연결
    nodes.forEach(node => {
      if (node.group === 2) {
        links.push({
          source: centerNode.id,
          target: node.id,
          value: 3,
          color: 'rgba(255, 255, 255, 0.3)'
        });

        // 주요 개념들 간의 연결 추가
        nodes.forEach(otherNode => {
          if (otherNode.group === 2 && node.id !== otherNode.id) {
            links.push({
              source: node.id,
              target: otherNode.id,
              value: 2,
              color: 'rgba(255, 255, 255, 0.15)'  // 더 투명하게 설정
            });
          }
        });
      }
    });

    // 주요 개념과 부차 개념들 연결
    nodes.forEach(node => {
      if (node.group === 3) {
        const mainConcepts = nodes.filter(n => n.group === 2);
        const randomMainConcept = mainConcepts[Math.floor(Math.random() * mainConcepts.length)];
        links.push({
          source: randomMainConcept.id,
          target: node.id,
          value: 2,
          color: 'rgba(255, 255, 255, 0.2)'
        });
      }
    });

    // 관련 개념들 연결
    nodes.forEach(node => {
      if (node.group === 4) {
        const possibleSources = nodes.filter(n => n.group === 2 || n.group === 3);
        const randomSource = possibleSources[Math.floor(Math.random() * possibleSources.length)];
        links.push({
          source: randomSource.id,
          target: node.id,
          value: 1,
          color: 'rgba(255, 255, 255, 0.1)'
        });
      }
    });

    return links;
  }, []);

  // graphData 생성
  const graphData = useMemo(() => {
    const nodes = createNodes();
    return {
      nodes,
      links: createLinks(nodes)
    };
  }, [createNodes, createLinks]);

  // 초기화 useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoom(5);
        fgRef.current.centerAt(0, 0, 1000);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 중심 노드 위치 조정 useEffect
  useEffect(() => {
    if (fgRef.current && graphData.nodes) {
      const centerNode = graphData.nodes.find(node => node.group === 1);
      if (centerNode) {
        centerNode.fx = 0;
        centerNode.fy = 0;
        fgRef.current.d3ReheatSimulation();
      }
    }
  }, [graphData]);

  // nodeCanvasObject 수정
  const nodeCanvasObject = useCallback((node, ctx) => {
    if (isNaN(node.x) || isNaN(node.y)) return;

    const size = node.group === 1 ? 15 : node.size;  // 중심 노드 크기 조절
    
    // group이 1인 경우 (중심 노드)
    if (node.group === 1 && backgroundImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
      ctx.clip();
      ctx.drawImage(backgroundImage, node.x - size, node.y - size, size * 2, size * 2);
      ctx.restore();
      
      // 테두리와 발광 효과
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.strokeStyle = node.color || '#ffa726';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.shadowColor = node.color || '#ffa726';
      ctx.shadowBlur = 15;
    } else {
      // 다른 노드들 그리기
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
    }
    
    // 텍스트 그리기
    const fontSize = node.group === 1 ? 4 : 3;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 텍스트 배경
    const textWidth = ctx.measureText(node.id).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(
      node.x - textWidth/2 - 1,
      node.y - fontSize/2 - 1,
      textWidth + 2,
      fontSize + 2
    );
    
    // 텍스트 그리기
    ctx.fillStyle = '#ffffff';
    ctx.fillText(node.id, node.x, node.y);
  }, [backgroundImage]);

  return (
    <div className="home-container">
      <div className="ontology-container">
        <div className="graph-container">
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeRelSize={6}
            nodeColor={node => node.color}
            backgroundColor="#000000"
            width={window.innerWidth}
            height={window.innerHeight}
            linkCanvasObject={(link, ctx) => {
              if (!link.source.x || !link.target.x) return;

              const start = { x: link.source.x, y: link.source.y };
              const end = { x: link.target.x, y: link.target.y };
              
              const time = Date.now() * 0.001;
              const duration = 2;
              const progress = (time % duration) / duration;
              
              const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
              
              const signalLength = 0.3;
              const signalStart = progress;
              const signalEnd = (progress + signalLength) % 1;
              
              gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
              gradient.addColorStop(Math.max(0, signalStart - 0.1), 'rgba(255, 255, 255, 0.1)');
              gradient.addColorStop(signalStart, 'rgba(255, 255, 255, 0.8)');
              gradient.addColorStop(signalEnd, 'rgba(255, 255, 255, 0.8)');
              gradient.addColorStop(Math.min(1, signalEnd + 0.1), 'rgba(255, 255, 255, 0.1)');
              gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
              
              ctx.beginPath();
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 0.8;
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();
            }}
            nodeCanvasObject={nodeCanvasObject}
            onNodeClick={setSelectedNode}
            autoPauseRedraw={false}
            cooldownTime={0}
            d3AlphaMin={0}
            d3AlphaDecay={0}
            d3VelocityDecay={0.3}
            cooldownTicks={100}
            enableNodeDrag={false}
            enableZoom={true}
            d3Force={('charge', d3.forceManyBody()
              .strength(-5000)  // -2000에서 -3000으로 변경하여 더 강하게 밀어내기
            )}
            d3Force={('collide', d3.forceCollide(node => 
              node.id === "직업전환" ? node.size * 12 : node.size * 15  // 충돌 범위 더 증가
            ))}
            d3Force={('link', d3.forceLink()
              .id(d => d.id)
              .distance(node => {
                if (node.source.id === "직업전환" || node.target.id === "직업전환") {
                  return 600;  // 400에서 600으로 증가
                }
                return 400;    // 200에서 400으로 증가
              })
              .strength(0.2)   // 0.3에서 0.2로 감소하여 더 유연하게
            )}
            d3Force={('center', d3.forceCenter(0, 0)
              .strength(0.2)  // 0.3에서 0.2로 감소
            )}
            onEngineStop={() => {
              const centerNode = graphData.nodes.find(node => node.id === "직업전환");
              if (centerNode) {
                centerNode.x = 0;
                centerNode.y = 0;
                fgRef.current?.d3ReheatSimulation();
              }
            }}
            centerAt={[0, 0]}
            linkColor={() => 'rgba(128, 128, 128, 0.3)'}
            linkWidth={0.2}
            linkDirectionalParticles={1}
            linkDirectionalParticleWidth={0.2}
            linkDirectionalParticleSpeed={0.005}
            zoom={1.5}  // 2에서 1.5로 변경하여 전체가 잘 보이도록
            minZoom={0.5}
            maxZoom={8}
            // Canvas 배경에 이미지 그리기
            onRenderFramePre={(ctx, canvas) => {
              if (!backgroundImage || !canvas) return;
              
              ctx.save();
              ctx.globalAlpha = 0.5;
              
              // 캔버스 전체에 이미지 그리기
              ctx.drawImage(
                backgroundImage,
                0,  // x 시작점
                0,  // y 시작점
                canvas.width,  // 캔버스 전체 너비
                canvas.height  // 캔버스 전체 높이
              );
              
              ctx.restore();
            }}
          />
        </div>
      </div>
      {selectedNode && (
        <div className="sidebar">
          <h2>{selectedNode.id}</h2>
          <p>{selectedNode.description}</p>
        </div>
      )}
    </div>
  );
}

export default HomePage; 