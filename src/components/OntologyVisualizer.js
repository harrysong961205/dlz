import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import * as N3 from 'n3';
import './OntologyVisualizer.css';

const nodeWidth = 180;
const nodeHeight = 40;

// 계층별 색상 정의
const LEVEL_COLORS = {
  0: '#e3f2fd', // 최상위 - 연한 파랑
  1: '#bbdefb',
  2: '#90caf9',
  3: '#64b5f6',
  4: '#42a5f5', // 최하위 - 진한 파랑
};

// 관계 타입별 색상 정의
const RELATION_COLORS = {
  'subClassOf': '#777777',
  'developed': '#ff7043',    // 주황색
  'founded': '#7cb342',      // 녹색
  'hasComponent': '#5c6bc0', // 남색
  'hasFeature': '#8e24aa',   // 보라색
  'hasTechnique': '#00acc1'  // 청록색
};

// 노드의 계층 레벨을 계산하는 함수
const calculateNodeLevels = (nodes, edges) => {
  const levels = {};
  const childToParents = {};

  // 부모-자식 관계 매핑
  edges.forEach(edge => {
    if (!childToParents[edge.target]) {
      childToParents[edge.target] = new Set();
    }
    childToParents[edge.target].add(edge.source);
  });

  // 재귀적으로 레벨 계산
  const calculateLevel = (nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const parents = childToParents[nodeId] || new Set();
    if (parents.size === 0) return 0;

    const parentLevels = Array.from(parents).map(parentId => 
      calculateLevel(parentId, visited)
    );
    return Math.max(...parentLevels) + 1;
  };

  // 모든 노드의 레벨 계산
  nodes.forEach(node => {
    levels[node.id] = calculateLevel(node.id);
  });

  return levels;
};

// dagre 레이아웃 설정 수정
const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // 위에서 아래로, 간격 넓게
  dagreGraph.setGraph({ 
    rankdir: 'TB',
    nodesep: 100,
    ranksep: 150,
    ranker: 'tight-tree' // 트리 형태로 정렬
  });

  // 노드 레벨 계산
  const nodeLevels = calculateNodeLevels(nodes, edges);

  // 노드 추가 (레벨별 색상 적용)
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight,
      level: nodeLevels[node.id]
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // 노드 위치와 스타일 업데이트
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const level = nodeLevels[node.id];
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      style: {
        ...node.style,
        width: nodeWidth,
        height: nodeHeight,
        background: LEVEL_COLORS[level] || '#ffffff',
        border: '1px solid #777',
        borderRadius: '5px',
        padding: '10px',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#333',
      },
    };
  });

  // 엣지 스타일 개선
  const layoutedEdges = edges.map(edge => ({
    ...edge,
    type: 'smoothstep',
    animated: true,
    style: { 
      stroke: '#777',
      strokeWidth: 1.5,
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#777',
    },
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

function OntologyVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);

  // 하위 노드들을 찾는 함수
  const findDescendants = useCallback((nodeId, edges) => {
    const descendants = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift();
      descendants.add(current);

      // 현재 노드에서 출발하는 모든 엣지 찾기
      edges.forEach(edge => {
        if (edge.source === current && !descendants.has(edge.target)) {
          queue.push(edge.target);
        }
      });
    }

    return descendants;
  }, []);

  // 노드 클릭 핸들러
  const onNodeClick = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(prevNode => prevNode === node.id ? null : node.id);
    setSelectedNodeInfo(node.data);
  }, []);

  // 노드와 엣지 스타일 업데이트
  const updateElementsStyle = useCallback((currentNodes, currentEdges, selectedNodeId) => {
    if (!currentNodes.length || !currentEdges.length) return { nodes: currentNodes, edges: currentEdges };
    
    if (!selectedNodeId) {
      // 선택된 노드가 없을 때는 원래 스타일로 복원
      const defaultNodes = currentNodes.map(node => ({
        ...node,
        style: {
          ...node.style,
          background: LEVEL_COLORS[calculateNodeLevels(currentNodes, currentEdges)[node.id]] || '#ffffff',
          border: '1px solid #777',
          opacity: 1,
        },
      }));

      const defaultEdges = currentEdges.map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: RELATION_COLORS[edge.label] || '#999',
          opacity: 1,
        },
      }));

      return { nodes: defaultNodes, edges: defaultEdges };
    }

    const descendants = findDescendants(selectedNodeId, currentEdges);
    
    const updatedNodes = currentNodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        background: descendants.has(node.id) 
          ? LEVEL_COLORS[calculateNodeLevels(currentNodes, currentEdges)[node.id]] 
          : '#f5f5f5',
        border: descendants.has(node.id) ? '2px solid #1a237e' : '1px solid #ccc',
        opacity: descendants.has(node.id) ? 1 : 0.5,
      },
    }));

    const updatedEdges = currentEdges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        stroke: descendants.has(edge.source) || descendants.has(edge.target)
          ? RELATION_COLORS[edge.label] || '#999'
          : '#ccc',
        opacity: descendants.has(edge.source) || descendants.has(edge.target) ? 1 : 0.3,
      },
    }));

    return { nodes: updatedNodes, edges: updatedEdges };
  }, [findDescendants]);

  // OWL 파싱 후 스타일 업데이트
  const parseOWL = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/knowledge_management.owl');
      const owlContent = await response.text();

      const parser = new N3.Parser();
      const store = new N3.Store();

      await new Promise((resolve, reject) => {
        parser.parse(owlContent, (error, quad, prefixes) => {
          if (error) reject(error);
          if (quad) store.add(quad);
          if (!quad) resolve();
        });
      });

      // 네임스페이스 정의
      const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
      const OWL = 'http://www.w3.org/2002/07/owl#';
      const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
      const KM = 'http://example.org/knowledge_management#';

      const classes = new Set();
      const labels = new Map();
      const objectProperties = new Map();
      
      // 클래스 찾기
      for (const quad of store.getQuads(null, RDF + 'type', OWL + 'Class', null)) {
        classes.add(quad.subject.value);
      }

      // 레이블 찾기
      for (const cls of classes) {
        const labelQuads = store.getQuads(cls, RDFS + 'label', null, null);
        if (labelQuads.length > 0) {
          labels.set(cls, labelQuads[0].object.value);
        }
      }

      // ObjectProperty 관계 찾기
      for (const quad of store.getQuads(null, RDF + 'type', OWL + 'ObjectProperty', null)) {
        const property = quad.subject.value;
        const domainQuads = store.getQuads(property, RDFS + 'domain', null, null);
        const rangeQuads = store.getQuads(property, RDFS + 'range', null, null);
        const labelQuads = store.getQuads(property, RDFS + 'label', null, null);

        if (domainQuads.length > 0 && rangeQuads.length > 0) {
          const propertyName = property.split('#')[1];
          objectProperties.set(property, {
            domain: domainQuads[0].object.value,
            range: rangeQuads[0].object.value,
            label: labelQuads.length > 0 ? labelQuads[0].object.value : propertyName
          });
        }
      }

      // 노드 생성
      const initialNodes = Array.from(classes).map((cls) => ({
        id: cls,
        data: { 
          label: labels.get(cls) || cls.split('#').pop() 
        },
        position: { x: 0, y: 0 },
        style: {
          background: '#ffffff',
          border: '1px solid #777',
          borderRadius: '5px',
          padding: '10px',
          textAlign: 'center',
          fontSize: '12px',
        },
      }));

      // 엣지 생성 (subClassOf 관계)
      const initialEdges = [];
      for (const cls of classes) {
        const subClassQuads = store.getQuads(cls, RDFS + 'subClassOf', null, null);
        for (const quad of subClassQuads) {
          initialEdges.push({
            id: `e${cls}-${quad.object.value}`,
            source: quad.object.value,
            target: cls,
            type: 'smoothstep',
            animated: true,
            label: 'subClassOf',
            style: { stroke: RELATION_COLORS['subClassOf'] },
            labelStyle: { fill: '#777', fontSize: 12 },
          });
        }
      }

      // ObjectProperty 관계를 엣지로 추가
      objectProperties.forEach((prop, propertyUri) => {
        const propertyName = propertyUri.split('#')[1];
        initialEdges.push({
          id: `p${propertyUri}`,
          source: prop.domain,
          target: prop.range,
          type: 'smoothstep',
          animated: true,
          label: prop.label,
          style: { 
            stroke: RELATION_COLORS[propertyName] || '#999',
            strokeWidth: 2,
            strokeDasharray: '5,5' // 점선으로 표시
          },
          labelStyle: { fill: RELATION_COLORS[propertyName] || '#999', fontSize: 12 },
          markerEnd: {
            type: 'arrowclosed',
            color: RELATION_COLORS[propertyName] || '#999',
          },
        });
      });

      // 레이아웃 적용
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLoading(false);
    } catch (error) {
      console.error('OWL 파일 처리 오류:', error);
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  // 초기 데이터 로드
  useEffect(() => {
    parseOWL();
  }, [parseOWL]);

  // 선택된 노드에 대한 스타일 업데이트
  useEffect(() => {
    if (!isLoading && nodes.length > 0 && edges.length > 0) {
      const { nodes: updatedNodes, edges: updatedEdges } = updateElementsStyle(nodes, edges, selectedNode);
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    }
  }, [selectedNode, isLoading, updateElementsStyle]);

  if (isLoading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div style={{ height: '800px', width: '100%', position: 'relative' }}>
      <h2>온톨로지 시각화</h2>
      <div style={{ height: '100%', width: selectedNodeInfo ? 'calc(100% - 300px)' : '100%', background: '#fafafa', transition: 'width 0.3s ease' }}>
        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          onNodeClick={onNodeClick}
          onPaneClick={() => {
            setSelectedNode(null);
            setSelectedNodeInfo(null);
          }}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap nodeColor={node => LEVEL_COLORS[calculateNodeLevels(nodes, edges)[node.id]] || '#ffffff'} />
        </ReactFlow>
      </div>
      
      {/* 사이드바 추가 */}
      {selectedNodeInfo && (
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>{selectedNodeInfo.label}</h3>
            <button 
              onClick={() => {
                setSelectedNode(null);
                setSelectedNodeInfo(null);
              }}
              className="close-button"
            >
              ×
            </button>
          </div>
          <div className="sidebar-content">
            <p>{selectedNodeInfo.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OntologyVisualizer; 