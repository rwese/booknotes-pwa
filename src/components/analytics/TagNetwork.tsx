import { useState, useMemo, useCallback, useRef } from 'react'
import './TagNetwork.css'

// Constants for force-directed layout
const REPULSION = 800
const ATTRACTION_BASE = 0.02
const CENTER_GRAVITY = 0.01
const VELOCITY_DAMPING = 0.85
const MAX_VELOCITY = 10
const ITERATIONS = 300
const LONG_PRESS_DURATION = 500

interface TagInfo {
  id: string
  count: number
}

interface Connection {
  id: string
  weight: number
}

interface TagNetworkData {
  tags: TagInfo[]
  connections: Record<string, Connection[]>
}

interface PositionedTag extends TagInfo {
  x: number
  y: number
  vx: number
  vy: number
}

interface Edge {
  source: string
  target: string
  weight: number
  type: 'internal' | 'semi' | 'external'
  fade: number
}

interface TagNetworkProps {
  data: TagNetworkData
  onTagLongPress?: (tag: string) => void
  onTagClick?: (tag: string) => void
}

const INITIAL_TAG_COUNT = 20

// Force-directed layout algorithm
function calculateForceLayout(
  tags: TagInfo[],
  connections: Record<string, Connection[]>,
  canvasWidth = 600,
  canvasHeight = 400
): Map<string, PositionedTag> {
  // Initialize positions randomly
  const positions = new Map<string, PositionedTag>()
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  tags.forEach((tag, index) => {
    const angle = (index / tags.length) * 2 * Math.PI
    const radius = 50 + Math.random() * 100
    positions.set(tag.id, {
      ...tag,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0
    })
  })

  // Run simulation
  for (let i = 0; i < ITERATIONS; i++) {
    // Apply repulsion between all nodes
    const positionArray = Array.from(positions.values())
    for (let a = 0; a < positionArray.length; a++) {
      for (let b = a + 1; b < positionArray.length; b++) {
        const nodeA = positionArray[a]
        const nodeB = positionArray[b]
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const distSq = dx * dx + dy * dy + 0.1
        const dist = Math.sqrt(distSq)
        const force = REPULSION / distSq

        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        nodeA.vx -= fx
        nodeA.vy -= fy
        nodeB.vx += fx
        nodeB.vy += fy
      }
    }

    // Apply attraction along edges
    for (const tag of positionArray) {
      const tagConnections = connections[tag.id] || []
      for (const conn of tagConnections) {
        const target = positions.get(conn.id)
        if (!target) continue

        const dx = target.x - tag.x
        const dy = target.y - tag.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        const force = ATTRACTION_BASE * conn.weight * dist

        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        tag.vx += fx
        tag.vy += fy
        target.vx -= fx
        target.vy -= fy
      }
    }

    // Apply center gravity
    for (const node of positionArray) {
      const dx = centerX - node.x
      const dy = centerY - node.y
      node.vx += dx * CENTER_GRAVITY
      node.vy += dy * CENTER_GRAVITY
    }

    // Update positions with damping
    for (const node of positionArray) {
      node.vx *= VELOCITY_DAMPING
      node.vy *= VELOCITY_DAMPING

      // Clamp velocity
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
      if (speed > MAX_VELOCITY) {
        node.vx = (node.vx / speed) * MAX_VELOCITY
        node.vy = (node.vy / speed) * MAX_VELOCITY
      }

      node.x += node.vx
      node.y += node.vy

      // Keep within bounds
      node.x = Math.max(30, Math.min(canvasWidth - 30, node.x))
      node.y = Math.max(30, Math.min(canvasHeight - 30, node.y))
    }
  }

  return positions
}

function calculateNodeRadius(count: number, maxCount: number): number {
  const ratio = maxCount > 0 ? count / maxCount : 0
  return 10 + ratio * 20
}

function calculateEdgeOpacity(weight: number, maxWeight: number): number {
  const ratio = maxWeight > 0 ? weight / maxWeight : 0
  return 0.3 + ratio * 0.6
}

export function TagNetwork({ data, onTagLongPress, onTagClick }: TagNetworkProps) {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set())
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [discoveredTags, setDiscoveredTags] = useState<Set<string>>(new Set())
  const [hoveredEdge, setHoveredEdge] = useState<{ source: string; target: string; weight: number } | null>(null)
  const [showReset, setShowReset] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressStartRef = useRef<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Calculate max count for sizing
  const maxCount = useMemo(() => {
    if (!data?.tags?.length) return 1
    return Math.max(...data.tags.map((t) => t.count), 1)
  }, [data?.tags])

  // Initial tags (top N by frequency)
  const initialTags = useMemo(() => {
    if (!data?.tags?.length) return []
    return data.tags.slice(0, INITIAL_TAG_COUNT)
  }, [data?.tags])

  // All visible tags (initial + discovered)
  const visibleTags = useMemo(() => {
    const discovered = data.tags.filter((t) => discoveredTags.has(t.id))
    return [...initialTags, ...discovered]
  }, [initialTags, discoveredTags, data?.tags])

  // Calculate positions with force-directed layout
  const positions = useMemo(() => {
    if (!data?.tags?.length) return new Map<string, PositionedTag>()
    return calculateForceLayout(visibleTags, data.connections)
  }, [visibleTags, data?.connections, data?.tags])

  // Build edges with type classification
  const edges = useMemo(() => {
    const result: Edge[] = []
    if (!data?.connections) return result

    const visibleIds = new Set(visibleTags.map((t) => t.id))

    // Calculate max weight for opacity
    let maxWeight = 0
    const allEdges: { source: string; target: string; weight: number }[] = []

    for (const tag of visibleTags) {
      const tagConnections = data.connections[tag.id] || []
      for (const conn of tagConnections) {
        // For expanded tags, show all connections
        if (expandedTags.has(tag.id)) {
          allEdges.push({ source: tag.id, target: conn.id, weight: conn.weight })
          maxWeight = Math.max(maxWeight, conn.weight)
        } else {
          // For non-expanded tags, only show top connection
          const topConn = tagConnections[0]
          if (topConn) {
            allEdges.push({ source: tag.id, target: topConn.id, weight: topConn.weight })
            maxWeight = Math.max(maxWeight, topConn.weight)
          }
        }
      }
    }

    // Classify edges and calculate fade
    for (const edge of allEdges) {
      const sourceVisible = visibleIds.has(edge.source)
      const targetVisible = visibleIds.has(edge.target)

      let type: Edge['type']
      let fade = 1

      if (sourceVisible && targetVisible) {
        type = 'internal'
      } else if (sourceVisible || targetVisible) {
        type = 'semi'
        // Fade based on whether the external node exists
        const externalId = sourceVisible ? edge.target : edge.source
        const externalTag = data.tags.find((t) => t.id === externalId)
        if (externalTag) {
          fade = 0.4
        } else {
          fade = 0.2
        }
      } else {
        type = 'external'
        fade = 0.3
      }

      result.push({ ...edge, type, fade })
    }

    return result
  }, [data?.connections, data?.tags, visibleTags, expandedTags])

  // Handle tag interaction
  const handleTagPressStart = useCallback((tagId: string) => {
    longPressStartRef.current = Date.now()
    longPressTimerRef.current = setTimeout(() => {
      // Trigger long press
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      onTagLongPress?.(tagId)
      longPressStartRef.current = null
    }, LONG_PRESS_DURATION)
  }, [onTagLongPress])

  const handleTagPressEnd = useCallback((tagId: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const pressDuration = longPressStartRef.current
      ? Date.now() - longPressStartRef.current
      : 0
    longPressStartRef.current = null

    // If short press (< 500ms), treat as click
    if (pressDuration < LONG_PRESS_DURATION) {
      // Toggle expansion
      setExpandedTags((prev) => {
        const next = new Set(prev)
        if (next.has(tagId)) {
          next.delete(tagId)
        } else {
          next.add(tagId)
        }
        return next
      })
      onTagClick?.(tagId)
    }
  }, [onTagClick])

  const handleEdgeClick = useCallback((edge: Edge) => {
    // Add the external tag to discovered
    const externalId = !new Set(visibleTags.map((t) => t.id)).has(edge.target)
      ? edge.target
      : !new Set(visibleTags.map((t) => t.id)).has(edge.source)
        ? edge.source
        : null

    if (externalId) {
      setDiscoveredTags((prev) => new Set([...prev, externalId]))
      setShowReset(true)
    }
  }, [visibleTags])

  const handleReset = useCallback(() => {
    setExpandedTags(new Set())
    setDiscoveredTags(new Set())
    setShowReset(false)
  }, [])

  // Early returns
  if (!data?.tags?.length) {
    return (
      <div className="tag-network tag-network--empty">
        <p className="tag-network__empty-message">No tags to display</p>
      </div>
    )
  }

  const positionArray = Array.from(positions.values())

  return (
    <div className="tag-network">
      <svg
        ref={svgRef}
        className="tag-network__svg"
        viewBox="0 0 600 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Edges */}
        <g className="tag-network__edges">
          {edges.map((edge, index) => {
            const source = positions.get(edge.source)
            const target = positions.get(edge.target)
            if (!source || !target) return null

            const isHovered = hoveredEdge?.source === edge.source && hoveredEdge?.target === edge.target
            const opacity = isHovered ? 1 : calculateEdgeOpacity(edge.weight, edges.length || 1) * edge.fade
            const strokeWidth = isHovered ? 3 : 1 + edge.weight * 0.5

            return (
              <g key={`${edge.source}-${edge.target}-${index}`}>
                {/* Invisible wider line for easier clicking */}
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="transparent"
                  strokeWidth={15}
                  style={{ cursor: edge.type !== 'internal' ? 'pointer' : 'default' }}
                  onClick={() => handleEdgeClick(edge)}
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
                {/* Visible edge */}
                <line
                  className={`tag-network__edge tag-network__edge--${edge.type} ${isHovered ? 'tag-network__edge--highlighted' : ''}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  strokeDasharray={edge.type === 'external' ? '5,5' : edge.type === 'semi' ? '3,3' : undefined}
                />
                {/* Weight label on hover */}
                {isHovered && (
                  <text
                    className="tag-network__edge-weight"
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2 - 5}
                    textAnchor="middle"
                  >
                    {edge.weight}
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* Nodes */}
        <g className="tag-network__nodes">
          {positionArray.map((tag) => {
            const isExpanded = expandedTags.has(tag.id)
            const isActive = activeTag === tag.id
            const hasMoreConnections = (data.connections[tag.id]?.length || 0) > (isExpanded ? 0 : 1)

            return (
              <g
                key={tag.id}
                className={`tag-network__node-group ${isActive ? 'tag-network__node-group--active' : ''} ${isExpanded ? 'tag-network__node-group--expanded' : ''}`}
                onMouseEnter={() => setActiveTag(tag.id)}
                onMouseLeave={() => setActiveTag(null)}
              >
                <circle
                  className={`tag-network__node-circle ${hasMoreConnections ? 'tag-network__node-circle--expandable' : ''}`}
                  cx={tag.x}
                  cy={tag.y}
                  r={calculateNodeRadius(tag.count, maxCount)}
                  onMouseDown={() => handleTagPressStart(tag.id)}
                  onMouseUp={() => handleTagPressEnd(tag.id)}
                  onMouseLeave={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current)
                      longPressTimerRef.current = null
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    handleTagPressStart(tag.id)
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    handleTagPressEnd(tag.id)
                  }}
                  onTouchCancel={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current)
                      longPressTimerRef.current = null
                    }
                  }}
                />
                <text
                  className="tag-network__node-label"
                  x={tag.x}
                  y={tag.y - calculateNodeRadius(tag.count, maxCount) - 8}
                  textAnchor="middle"
                >
                  {tag.id}
                </text>
                <text
                  className="tag-network__node-count"
                  x={tag.x}
                  y={tag.y + 4}
                  textAnchor="middle"
                >
                  {tag.count}
                </text>
                {/* Expansion indicator */}
                {hasMoreConnections && (
                  <text
                    className="tag-network__expand-hint"
                    x={tag.x}
                    y={tag.y + calculateNodeRadius(tag.count, maxCount) + 14}
                    textAnchor="middle"
                  >
                    {isExpanded ? '−' : '+'}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Reset button */}
      {showReset && (
        <button className="tag-network__reset" onClick={handleReset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset
        </button>
      )}

      {/* Legend */}
      <div className="tag-network__legend">
        <span className="tag-network__legend-text">
          {visibleTags.length}/{data.tags.length} tags • Click to explore, hold to filter
        </span>
      </div>

      {/* Tooltip */}
      {hoveredEdge && (
        <div className="tag-network__tooltip">
          <span className="tag-network__tooltip-label">
            {hoveredEdge.weight} {hoveredEdge.weight === 1 ? 'book' : 'books'} have both
          </span>
        </div>
      )}
    </div>
  )
}
