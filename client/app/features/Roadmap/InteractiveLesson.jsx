import React, { useState, useEffect, useMemo } from "react";
import ReactFlow, { Background, Controls, Handle, Position, MarkerType, ReactFlowProvider, useReactFlow } from "reactflow";
import "reactflow/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Maximize2, Minimize2, Check, AlertTriangle, 
  HelpCircle, Play, ChevronLeft, ChevronRight, Zap, 
  ArrowRight, Award, Compass, Layers, Database, BookOpen, Lightbulb 
} from "lucide-react";
import * as sound from "../../utils/audio";

const elk = new ELK();

// ========================================================
// CUSTOM REACT FLOW NODE FOR MAIN DEPENDENCY TREE
// ========================================================
const CustomDependencyNode = ({ data }) => {
  const { label, isMastery, status } = data;
  
  let border = "1px solid rgba(255, 255, 255, 0.08)";
  let bg = "rgba(15, 23, 42, 0.7)";
  let color = "#94a3b8";
  let glow = "none";
  let statusIcon = "🔒";

  if (status === "active") {
    border = "2px solid #ff6a00";
    bg = "rgba(255, 106, 0, 0.12)";
    color = "#ffffff";
    glow = "0 0 20px rgba(255, 106, 0, 0.25)";
    statusIcon = "⚡";
  } else if (status === "solved") {
    border = "2px solid #10b981";
    bg = "rgba(16, 185, 129, 0.12)";
    color = "#34d399";
    statusIcon = "✅";
  } else if (status === "failed") {
    border = "2px solid #ef4444";
    bg = "rgba(239, 68, 68, 0.12)";
    color = "#f87171";
    statusIcon = "⚠️";
  }

  return (
    <div style={{
      border,
      background: bg,
      color,
      boxShadow: glow,
      padding: "12px 18px",
      borderRadius: "14px",
      fontFamily: "'Inter', sans-serif",
      fontSize: "12.5px",
      fontWeight: "750",
      textAlign: "center",
      minWidth: "190px",
      backdropFilter: "blur(12px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      position: "relative"
    }}>
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>{statusIcon}</span>
        <span>{label}</span>
      </div>
      {isMastery && (
        <span style={{
          fontSize: "8.5px",
          color: "#ffb300",
          background: "rgba(255, 179, 0, 0.12)",
          padding: "2px 6px",
          borderRadius: "4px",
          marginTop: "4px",
          letterSpacing: "0.5px",
          fontWeight: "800"
        }}>
          MASTERY GOAL
        </span>
      )}
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  );
};

// ========================================================
// CUSTOM REACT FLOW NODE FOR CONCEPT EXPLANATION VISUALS
// ========================================================
const CustomConceptNode = ({ data }) => {
  const { label, type, details } = data;
  
  let bg = "rgba(30, 41, 59, 0.85)";
  let border = "1px solid rgba(255, 255, 255, 0.1)";
  let color = "#fff";
  
  if (type === "stack") {
    bg = "rgba(59, 130, 246, 0.15)";
    border = "1px solid #3b82f6";
    color = "#93c5fd";
  } else if (type === "heap") {
    bg = "rgba(139, 92, 246, 0.15)";
    border = "1px solid #8b5cf6";
    color = "#c084fc";
  } else if (type === "scope") {
    bg = "rgba(16, 185, 129, 0.15)";
    border = "1px solid #10b981";
    color = "#6ee7b7";
  } else if (type === "function") {
    bg = "rgba(234, 88, 12, 0.15)";
    border = "1px solid #ea580c";
    color = "#fdba74";
  }

  return (
    <div style={{
      background: bg,
      border,
      color,
      padding: "20px 24px",
      borderRadius: "10px",
      fontSize: "18px",
      minWidth: "220px",
      textAlign: "center",
      position: "relative"
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ fontWeight: "800" }}>{label}</div>
      {details && <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.55)", marginTop: "6px", lineHeight: "1.35" }}>{details}</div>}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

// ========================================================
// CONCEPT VISUALIZER SUB-COMPONENT (EXPLANATION FLOW)
// ========================================================
function ConceptVisualizer({ visuals, isTreeOpen }) {
  return (
    <ReactFlowProvider>
      <ConceptVisualizerInner visuals={visuals} isTreeOpen={isTreeOpen} />
    </ReactFlowProvider>
  );
}

function ConceptVisualizerInner({ visuals, isTreeOpen }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!visuals || !visuals.nodes) return;

    const buildConceptGraph = async () => {
      const rfNodes = visuals.nodes.map(n => ({
        id: n.id,
        data: { label: n.label, type: n.type, details: n.details },
        type: "conceptNode"
      }));

      const rfEdges = (visuals.edges || []).map(e => ({
        id: `${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        label: e.label,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#ff6a00", strokeWidth: 1.2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#ff6a00" },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 6,
        labelBgStyle: { fill: "#090d16", fillOpacity: 0.95, stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 },
        labelStyle: { fill: "#cbd5e1", fontSize: 9.5, fontWeight: 700 }
      }));

      const elkGraph = {
        id: "concept-root",
        layoutOptions: {
          "org.eclipse.elk.algorithm": "layered",
          "org.eclipse.elk.direction": "RIGHT",
          "org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers": 180, // shorter lines between columns
          "org.eclipse.elk.spacing.nodeNode": 85,                      // shorter vertical lines
          "org.eclipse.elk.spacing.edgeNode": 40,
          "org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers": 40,
          "org.eclipse.elk.padding": "[top=25,left=25,bottom=25,right=25]"
        },
        children: rfNodes.map(n => ({ id: n.id, width: 340, height: 130 })),
        edges: rfEdges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] }))
      };

      try {
        const layout = await elk.layout(elkGraph);
        const positionedNodes = rfNodes.map(n => {
          const nodeLoc = layout.children.find(c => c.id === n.id);
          return {
            ...n,
            position: { x: nodeLoc.x, y: nodeLoc.y }
          };
        });
        setNodes(positionedNodes);
        setEdges(rfEdges);
      } catch (err) {
        console.warn("ELK layout failed, deploying topological fallback layout:", err);
        // Fallback topological layering DAG positioning
        const colMap = {};
        rfNodes.forEach(n => { colMap[n.id] = 0; });
        
        for (let iter = 0; iter < 6; iter++) {
          (visuals.edges || []).forEach(e => {
            const srcCol = colMap[e.from] || 0;
            colMap[e.to] = Math.max(colMap[e.to] || 0, srcCol + 1);
          });
        }

        const colCounts = {};
        const colIndices = {};
        rfNodes.forEach(n => {
          const col = colMap[n.id] || 0;
          colCounts[col] = (colCounts[col] || 0) + 1;
          colIndices[n.id] = 0;
        });

        const positionedNodes = rfNodes.map(n => {
          const col = colMap[n.id] || 0;
          const count = colCounts[col] || 1;
          const idx = colIndices[n.id]++;
          
          const yOffset = (idx - (count - 1) / 2) * 140 + 100;
          const xOffset = col * 320 + 50;
          
          return {
            ...n,
            position: { x: xOffset, y: yOffset }
          };
        });
        setNodes(positionedNodes);
        setEdges(rfEdges);
      }
    };

    buildConceptGraph();
  }, [visuals]);

  // Recalculate fitView when the tree collapses or nodes are set
  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = setTimeout(() => {
      fitView({ duration: 400, minZoom: 0.72, maxZoom: 1.0 });
    }, 320); // wait for width animation to complete
    return () => clearTimeout(timer);
  }, [isTreeOpen, nodes, fitView]);

  const nodeTypes = useMemo(() => ({ conceptNode: CustomConceptNode }), []);

  return (
    <div style={{ 
      width: "100%", 
      height: isTreeOpen ? "380px" : "520px", 
      border: "none", 
      borderRadius: "0px", 
      overflow: "hidden", 
      background: "transparent",
      position: "relative",
      transition: "height 0.3s ease"
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ minZoom: 0.72, maxZoom: 1.0 }}
        zoomOnScroll={true}
        panOnScroll={false}
        panOnDrag={true}
        preventScrolling={false}
      >
        <Background color="#222" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

// ========================================================
// MAIN INTERACTIVE ADAPTIVE LESSON COMPONENT
// ========================================================
export default function InteractiveLesson({ 
  lessonData, 
  onClose, 
  isDarkMode = true, 
  levelColor = "#ff6a00",
  isExpanded = false,
  onToggleExpand
}) {
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [solvedNodeIds, setSolvedNodeIds] = useState(new Set());
  const [failedAttempts, setFailedAttempts] = useState({}); // id -> count
  const [journeyPath, setJourneyPath] = useState([]); // stack trace path
  const [viewMode, setViewMode] = useState("challenge"); // challenge, explanation, breakdown, complete
  const [currentStepIdx, setCurrentStepIdx] = useState(0); // Solution timeline stepper index

  const [isTreeOpen, setIsTreeOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("kaevrix_is_tree_open") !== "false";
  });

  useEffect(() => {
    localStorage.setItem("kaevrix_is_tree_open", isTreeOpen ? "true" : "false");
  }, [isTreeOpen]);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Flatten both mastery check points and prerequisites for unified map parsing
  const nodesMap = useMemo(() => {
    if (!lessonData || !lessonData.masteryCheckpoints) return {};
    const map = {};
    
    lessonData.masteryCheckpoints.forEach(m => {
      map[m.id] = {
        ...m,
        isMastery: true,
        challenge: {
          title: m.title,
          description: m.description,
          codeTemplate: m.codeTemplate
        }
      };
    });

    lessonData.prerequisiteNodes?.forEach(p => {
      map[p.id] = {
        ...p,
        isMastery: false
      };
    });

    return map;
  }, [lessonData]);

  // Set starting node
  useEffect(() => {
    if (lessonData?.masteryCheckpoints?.length > 0) {
      const firstMasteryId = lessonData.masteryCheckpoints[0].id;
      setActiveNodeId(firstMasteryId);
      setJourneyPath([firstMasteryId]);
    }
  }, [lessonData]);

  // Recalculate ELK diagram layouts when states mutate
  useEffect(() => {
    if (!lessonData || !lessonData.masteryCheckpoints) return;
    
    const buildGraph = async () => {
      const rfNodes = [];
      const rfEdges = [];

      // Add mastery checkpoints
      lessonData.masteryCheckpoints.forEach(m => {
        rfNodes.push({
          id: m.id,
          data: {
            label: m.title,
            isMastery: true,
            status: activeNodeId === m.id ? "active" : (solvedNodeIds.has(m.id) ? "solved" : "locked")
          },
          type: "dependencyNode"
        });
        
        m.prerequisites?.forEach(pId => {
          rfEdges.push({
            id: `${pId}-${m.id}`,
            source: pId,
            target: m.id,
            animated: activeNodeId === m.id,
            style: { 
              stroke: activeNodeId === m.id ? "#ff6a00" : (solvedNodeIds.has(pId) ? "#10b981" : "rgba(255,255,255,0.06)"),
              strokeWidth: 2
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: solvedNodeIds.has(pId) ? "#10b981" : "#444" }
          });
        });
      });

      // Add prerequisite nodes
      lessonData.prerequisiteNodes?.forEach(p => {
        rfNodes.push({
          id: p.id,
          data: {
            label: p.title,
            isMastery: false,
            status: activeNodeId === p.id 
              ? "active" 
              : (solvedNodeIds.has(p.id) 
                  ? "solved" 
                  : (failedAttempts[p.id] ? "failed" : "locked"))
          },
          type: "dependencyNode"
        });

        p.prerequisites?.forEach(pId => {
          rfEdges.push({
            id: `${pId}-${p.id}`,
            source: pId,
            target: p.id,
            animated: activeNodeId === p.id,
            style: { 
              stroke: activeNodeId === p.id ? "#ff6a00" : (solvedNodeIds.has(pId) ? "#10b981" : "rgba(255,255,255,0.06)"),
              strokeWidth: 2
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: solvedNodeIds.has(pId) ? "#10b981" : "#444" }
          });
        });
      });

      // ELK layout algorithms Flow
      const elkGraph = {
        id: "root",
        layoutOptions: {
          "org.eclipse.elk.algorithm": "layered",
          "org.eclipse.elk.direction": "UP",
          "org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers": 110, // correct namespace
          "org.eclipse.elk.spacing.nodeNode": 85,
          "org.eclipse.elk.spacing.edgeNode": 50
        },
        children: rfNodes.map(n => ({ id: n.id, width: 200, height: 70 })),
        edges: rfEdges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] }))
      };

      try {
        const layout = await elk.layout(elkGraph);
        const positionedNodes = rfNodes.map(n => {
          const nodeLoc = layout.children.find(c => c.id === n.id);
          return {
            ...n,
            position: { x: nodeLoc.x, y: nodeLoc.y }
          };
        });
        setNodes(positionedNodes);
        setEdges(rfEdges);
      } catch (err) {
        console.error("ELK main layout failed:", err);
      }
    };

    buildGraph();
  }, [lessonData, activeNodeId, solvedNodeIds, failedAttempts]);

  const activeNode = nodesMap[activeNodeId];

  // User solved challenge
  const handleSolved = () => {
    sound.playCorrect();
    const updatedSolved = new Set(solvedNodeIds);
    updatedSolved.add(activeNodeId);
    setSolvedNodeIds(updatedSolved);

    // Pop solved node from stack trace path
    const nextPath = [...journeyPath];
    nextPath.pop();
    setJourneyPath(nextPath);

    if (nextPath.length > 0) {
      const parentId = nextPath[nextPath.length - 1];
      setActiveNodeId(parentId);
      setViewMode("challenge");
    } else {
      // Completed current master branch completely
      const unsolvedMastery = lessonData.masteryCheckpoints.find(m => !updatedSolved.has(m.id));
      if (unsolvedMastery) {
        setActiveNodeId(unsolvedMastery.id);
        setJourneyPath([unsolvedMastery.id]);
        setViewMode("challenge");
      } else {
        setViewMode("complete");
      }
    }
  };

  // User failed challenge
  const handleFailed = () => {
    sound.playIncorrect();
    const currentFailCount = (failedAttempts[activeNodeId] || 0) + 1;
    setFailedAttempts(prev => ({
      ...prev,
      [activeNodeId]: currentFailCount
    }));

    // Find first unsolved prerequisite
    const unsolvedPrereqs = activeNode.prerequisites?.filter(pid => !solvedNodeIds.has(pid)) || [];

    if (unsolvedPrereqs.length > 0) {
      // Degrade the checkpoint to the next unsolved prerequisite
      const nextPrereqId = unsolvedPrereqs[0];
      setJourneyPath(prev => [...prev, nextPrereqId]);
      setActiveNodeId(nextPrereqId);
      setViewMode("challenge");
    } else {
      // No more unsolved prerequisites, reveal notes
      if (currentFailCount === 1) {
        setViewMode("explanation");
      } else {
        setCurrentStepIdx(0);
        setViewMode("breakdown");
      }
    }
  };

  const nodeTypes = useMemo(() => ({ dependencyNode: CustomDependencyNode }), []);

  if (!lessonData || !activeNode) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <p>No interactive lesson content available. Connection offline.</p>
        <button onClick={onClose} className="lesson-btn">Close Panel</button>
      </div>
    );
  }

  return (
    <div className={`lesson-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      <style>{`
        .lesson-container {
          position: fixed;
          inset: 0;
          z-index: 1050;
          display: flex;
          flex-direction: column;
          font-family: var(--font-sans), 'Inter', sans-serif;
          background: #05070c;
          color: #f1f5f9;
        }

        /* Top Header */
        .lesson-header {
          background: linear-gradient(135deg, #0e1321 0%, #05070c 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .lesson-title-area {
          display: flex;
          flex-direction: column;
        }
        .lesson-subtitle {
          color: #ff6a00;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .lesson-title {
          font-size: 18px;
          font-weight: 900;
          margin-top: 2px;
          font-family: var(--font-outfit), 'Outfit', sans-serif;
        }

        /* Split Workspace Frame */
        .lesson-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        /* Left Side Flow Graph Panel */
        .lesson-left-graph {
          width: 40%;
          min-width: 320px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          background: #07090e;
        }

        /* Right Side Content Workspace */
        .lesson-right-content {
          flex: 1;
          overflow-y: auto;
          background: #05070c;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
        }

        .lesson-content-max {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Stepper elements */
        .stepper-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          padding: 14px 20px;
          border-radius: 12px;
        }

        /* Code box templates styling */
        .code-box {
          font-family: 'Consolas', 'Courier New', monospace;
          background: #090d16;
          color: #a7f3d0;
          padding: 20px;
          border-radius: 12px;
          overflow-x: auto;
          font-size: 13px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          line-height: 1.5;
        }

        .lesson-btn {
          font-family: var(--font-outfit), 'Outfit', sans-serif;
          font-size: 13.5px;
          font-weight: 800;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
        }
        
        .lesson-btn.primary {
          background: linear-gradient(135deg, #ff6a00 0%, #ea580c 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.2);
        }
        .lesson-btn.primary:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(234, 88, 12, 0.35);
        }

        .lesson-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);
        }
        .lesson-btn.success:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
        }

        .lesson-btn.danger {
          background: rgba(239, 68, 68, 0.08);
          border: 1.5px solid #ef4444;
          color: #f87171;
        }
        .lesson-btn.danger:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .lesson-btn.outline {
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.08);
          color: #cbd5e1;
        }
        .lesson-btn.outline:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }
      `}</style>

      {/* Top Header Navigation */}
      <div className="lesson-header">
        <div className="lesson-title-area">
          <span className="lesson-subtitle">Adaptive Study Sandbox</span>
          <h1 className="lesson-title">{lessonData.topicName}</h1>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Collapse/Expand Prerequisite Tree Button */}
          <button
            onClick={() => {
              sound.playClockTick();
              setIsTreeOpen(prev => !prev);
            }}
            className="lesson-btn outline"
            style={{ 
              background: isTreeOpen ? "rgba(255,255,255,0.03)" : "rgba(255,106,0,0.15)", 
              borderColor: isTreeOpen ? "rgba(255,255,255,0.08)" : "rgba(255,106,0,0.45)",
              color: isTreeOpen ? "#cbd5e1" : "#ff8800",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title={isTreeOpen ? "Hide Dependency Tree" : "Show Dependency Tree"}
          >
            <span>🌳</span> {isTreeOpen ? "Hide Tree" : "Show Tree"}
          </button>

          {onToggleExpand && (
            <button 
              onClick={() => {
                sound.playClockTick();
                onToggleExpand();
              }} 
              className="lesson-btn"
              style={{ background: "rgba(255,255,255,0.05)", color: "#cbd5e1" }}
              title={isExpanded ? "Collapse to Sidebar" : "Fullscreen"}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          <button onClick={onClose} className="lesson-btn outline">
            <X size={15} /> Exit
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="lesson-body">
        
        {/* Left Side: React Flow Dependency Tree */}
        {isTreeOpen && (
          <div className="lesson-left-graph" style={{ width: "40%", minWidth: "320px" }}>
            <div style={{ position: "absolute", top: "16px", left: "16px", zIndex: 10, background: "rgba(10,15,30,0.8)", border: "1px solid rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "10px" }}>
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#ff6a00", letterSpacing: "0.5px" }}>PREREQUISITE DEPENDENCY TREE</span>
            </div>
            
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              zoomOnScroll={false}
              preventScrolling={true}
            >
              <Background color="#111" gap={16} size={1} />
            </ReactFlow>
          </div>
        )}

        {/* Right Side: Adaptive Learning State Workspaces */}
        <div className="lesson-right-content">
          <div className="lesson-content-max" style={{ maxWidth: isTreeOpen ? "680px" : "1200px", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <AnimatePresence mode="wait">
              
              {/* STATE A: CHALLENGE MODE */}
              {viewMode === "challenge" && (
                <motion.div
                  key="challenge-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px" }}>
                    <div style={{ borderLeft: `3px solid ${levelColor}`, paddingLeft: "16px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "900", color: levelColor, textTransform: "uppercase", letterSpacing: "1px" }}>
                        Active Node: {activeNode.isMastery ? "Mastery Checkpoint" : "Prerequisite Concept"}
                      </span>
                      <h2 style={{ fontSize: "24px", fontWeight: "900", marginTop: "4px" }}>
                        {activeNode.title}
                      </h2>
                      {!activeNode.isMastery && (
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                          Difficulty: {activeNode.difficulty}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "4px" }}>
                      <button onClick={handleSolved} className="lesson-btn success" style={{ padding: "10px 18px", fontSize: "12.5px" }}>
                        <Check size={14} /> I solved it
                      </button>
                      <button onClick={handleFailed} className="lesson-btn danger" style={{ padding: "10px 18px", fontSize: "12.5px" }}>
                        <AlertTriangle size={14} /> I couldn't solve it
                      </button>
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "20px", borderRadius: "16px", lineHeight: "1.6" }}>
                    <p style={{ margin: 0, fontSize: "14.5px", color: "#cbd5e1" }}>
                      {activeNode.challenge.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#ffb300", letterSpacing: "0.5px" }}>CODE SNIPPET</span>
                    <pre className="code-box">{activeNode.challenge.codeTemplate}</pre>
                  </div>
                </motion.div>
              )}

              {/* STATE B: CONCEPT EXPLANATION MODE */}
              {viewMode === "explanation" && (
                <motion.div
                  key="explanation-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px" }}>
                    <div style={{ borderLeft: "3px solid #ffb300", paddingLeft: "16px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "900", color: "#ffb300", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Explanation: {activeNode.title}
                      </span>
                      <h2 style={{ fontSize: "22px", fontWeight: "900", marginTop: "4px" }}>
                        Concept Breakdown
                      </h2>
                    </div>

                    <button onClick={() => setViewMode("challenge")} className="lesson-btn primary" style={{ padding: "10px 20px", fontSize: "12.5px", marginBottom: "4px" }}>
                      Got it, retry challenge <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Textbook Style Study Notes (Orange margin line directly on page text, no container box) */}
                  <div style={{
                    borderLeft: "3.5px solid #ff6a00",
                    paddingLeft: "20px",
                    lineHeight: "1.8",
                    fontSize: "15.5px",
                    color: "#e2e8f0",
                    margin: "12px 0 24px 0",
                    whiteSpace: "pre-line",
                    textAlign: "justify"
                  }}>
                    {activeNode.explanation.story}
                  </div>

                  {/* React Flow Rendered Concept Visualizer */}
                  {activeNode.explanation.visuals && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px" }}>V8 MEMORY & EXECUTION MODEL</span>
                      <ConceptVisualizer visuals={activeNode.explanation.visuals} isTreeOpen={isTreeOpen} />
                    </div>
                  )}
                </motion.div>
              )}

              {/* STATE C: SOLUTION BREAKDOWN MODE */}
              {viewMode === "breakdown" && (
                <motion.div
                  key="breakdown-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                >
                  <div style={{ borderLeft: "3px solid #ef4444", paddingLeft: "16px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: "#ef4444", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Deep Analysis: {activeNode.title}
                    </span>
                    <h2 style={{ fontSize: "22px", fontWeight: "900", marginTop: "4px" }}>
                      Step-by-Step Solution Breakdown
                    </h2>
                  </div>

                  {/* Stepper Timeline Navigation */}
                  {activeNode.solutionBreakdown?.timeline?.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div className="stepper-header">
                        <button 
                          disabled={currentStepIdx === 0} 
                          onClick={() => setCurrentStepIdx(prev => prev - 1)}
                          className="lesson-btn outline"
                          style={{ padding: "8px 16px" }}
                        >
                          <ChevronLeft size={16} /> Back
                        </button>
                        <span style={{ fontSize: "13px", fontWeight: "800" }}>
                          Execution Step {currentStepIdx + 1} of {activeNode.solutionBreakdown.timeline.length}
                        </span>
                        <button 
                          disabled={currentStepIdx === activeNode.solutionBreakdown.timeline.length - 1} 
                          onClick={() => setCurrentStepIdx(prev => prev + 1)}
                          className="lesson-btn outline"
                          style={{ padding: "8px 16px" }}
                        >
                          Next <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Active Step Details */}
                      <div style={{ background: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#fff" }}>
                          Action: {activeNode.solutionBreakdown.timeline[currentStepIdx].action}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                          State: {activeNode.solutionBreakdown.timeline[currentStepIdx].memory}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed Walkthrough Content */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px" }}>WALKTHROUGH ANALYSIS</span>
                    <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
                      {activeNode.solutionBreakdown.walkthrough}
                    </p>
                  </div>

                  <button onClick={() => setViewMode("challenge")} className="lesson-btn primary" style={{ marginTop: "16px" }}>
                    Got it, retry challenge <ArrowRight size={15} />
                  </button>
                </motion.div>
              )}

              {/* STATE D: COMPLETE CELEBRATION */}
              {viewMode === "complete" && (
                <motion.div
                  key="complete-view"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    textAlign: "center",
                    gap: "24px", 
                    padding: "48px 0" 
                  }}
                >
                  <div style={{ fontSize: "72px", animation: "pulse 2s infinite" }}>🏆</div>
                  
                  <div>
                    <h2 style={{ fontSize: "28px", fontWeight: "950", color: "#10b981", margin: 0, textTransform: "uppercase", letterSpacing: "1.5px" }}>
                      Mastery Achieved!
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14.5px", marginTop: "8px", maxWidth: "460px", lineHeight: "1.6" }}>
                      You have successfully resolved the final mastery checkpoint and validated your conceptual prerequisites.
                    </p>
                  </div>

                  <div style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: "1px solid rgba(255,255,255,0.06)", 
                    padding: "24px 36px", 
                    borderRadius: "16px",
                    display: "flex",
                    gap: "40px"
                  }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "800", textTransform: "uppercase" }}>PREREQS SOLVED</div>
                      <div style={{ fontSize: "24px", fontWeight: "900", color: "#10b981", marginTop: "4px" }}>
                        {solvedNodeIds.size}
                      </div>
                    </div>
                    <div style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }} />
                    <div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "800", textTransform: "uppercase" }}>ATTEMPTS TAILORED</div>
                      <div style={{ fontSize: "24px", fontWeight: "900", color: "#ffb300", marginTop: "4px" }}>
                        {Object.values(failedAttempts).reduce((a, b) => a + b, 0)}
                      </div>
                    </div>
                  </div>

                  <button onClick={onClose} className="lesson-btn success" style={{ padding: "16px 40px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Exit Study Sandbox
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
