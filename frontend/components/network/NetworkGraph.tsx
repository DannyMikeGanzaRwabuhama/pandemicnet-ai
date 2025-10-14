'use client';

import {D3Link, D3Node, NetworkEdge, NetworkNode} from "@/lib/types";
import * as d3 from 'd3';
import {useEffect, useRef, useState} from "react";

interface NetworkGraphProps {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    width?: number;
    height?: number;
    onNodeClick?: (node: NetworkNode) => void;
    selectedNodeId?: string | null;
}

export default function NetworkGraph({
                                         nodes,
                                         edges,
                                         width = 1200,
                                         height = 800,
                                         onNodeClick,
                                         selectedNodeId
                                     }: NetworkGraphProps) {
    const svgRef = useRef<SVGElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        // Clear previous graph
        d3.select(svgRef.current).selectAll('*').remove();

        // Create SVG container
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Add zoom behavior
        const g = svg.append('g');

        const zoom = d3.zoom<SVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Prepare data for D3
        const d3Nodes: D3Node[] = nodes.map(node => ({
            ...node,
            x: width / 2,
            y: height / 2,
        }));

        const d3Links: D3Link[] = edges.map(edge => ({
            ...edge,
            source: edge.source,
            target: edge.target,
        }));

        // Color scale based on infection status and risk
        const getNodeColor = (node: D3Node): string => {
            if (node.infected) return '#EF4444'; // Red - Infected
            if (!node.risk_score) return '#3B82F6'; // Blue - Healthy
            if (node.risk_score > 0.7) return '#F97316'; // Orange - High risk
            if (node.risk_score > 0.4) return '#EAB308'; // Yellow - Medium risk
            return '#22C55E'; // Green - Low risk
        };

        // Node size based on connections
        const getNodeRadius = (node: D3Node): number => {
            const baseSize = 8;
            const maxSize = 25;
            const scale = Math.min(node.connections / 10, 1);
            return baseSize + (maxSize - baseSize) * scale;
        }

        // Edge color and width
        const getEdgeColor = (link: D3Link): string => {
            return '#334155'; // Neutral color
        };

        const getEdgeWidth = (link: D3Link): number => {
            if (link.proximity === 'close') return 3;
            if (link.proximity === 'medium') return 2;
            return 1;
        };

        // Create force simulation
        const simulation = d3.forceSimulation<D3Node>(d3Nodes)
            .force('link', d3.forceLink<D3Node, D3Link>(d3Links)
                .id((d) => d.id)
                .distance(100)
                .strength(0.5))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => getNodeRadius(d as D3Node) + 5));

        // Draw links
        const link = g.append('g')
            .selectAll('line')
            .data(d3Links)
            .join('line')
            .attr('stroke', getEdgeColor)
            .attr('stroke-width', getEdgeWidth)
            .attr('stroke-opacity', 0.6);

        // Draw nodes
        const node = g.append('g')
            .selectAll<SVGCircleElement, D3Node>('circle')
            .data(d3Nodes)
            .join('circle')
            .attr('r', getNodeRadius)
            .attr('fill', getNodeColor)
            .attr('stroke', d => d.id === selectedNodeId ? '#FFFFFF' : 'none')
            .attr('stroke-width', 3)
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                onNodeClick?.(d);
            })
            .on('mouseenter', (event, d) => {
                setHoveredNode(d.id);
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr('r', getNodeRadius(d) * 1.3);
            })
            .on('mouseleave', (event, d) => {
                setHoveredNode(null);
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr('r', getNodeRadius(d));
            })
            .call(d3
                .drag<SVGCircleElement, D3Node>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        // Add labels for infected and high-risk nodes
        const label = g.append('g')
            .selectAll('text')
            .data(d3Nodes.filter(d => d.infected || (d.risk_score && d.risk_score > 0.7)))
            .join('text')
            .text((d) => d.id)
            .attr('font-size', 10)
            .attr('font-family', 'sans-serif')
            .attr('text-anchor', 'middle')
            .attr('dy', -15)
            .attr('pointer-events', 'none');

        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as D3Node).x!)
                .attr('y1', d => (d.source as D3Node).y!)
                .attr('x2', d => (d.target as D3Node).x!)
                .attr('y2', d => (d.target as D3Node).y!);

            node
                .attr('cx', d => d.x!)
                .attr('cy', d => d.y!)

            label
                .attr('x', d => d.x!)
                .attr('y', d => d.y!)
        });

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [nodes, edges, width, height, onNodeClick, selectedNodeId]);

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
            <svg ref={svgRef} className={"w-full h-full"}/>

            {/*    Legend*/}
            <div className="absolute bottom-4 right-4 bg-slate-800/90 p-4 rounded-lg backdrop-blur">
                <h3 className={"text-sm font-semibold text-slate-100 mb-2"}>Legend</h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"/>
                        <span className="text-xs text-slate-300">Infected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-500"/>
                        <span className="text-xs text-slate-300">High Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500"/>
                        <span className="text-xs text-slate-300">Medium Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"/>
                        <span className="text-xs text-slate-300">Low Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500"/>
                        <span className="text-xs text-slate-300">Healthy</span>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                        Node size = connections<br/>
                        Drag to move • Scroll to zoom
                    </p>
                </div>
            </div>

            {/*    Hover tooltip*/}
            {hoveredNode && (
                <div className="absolute top-4 left-4 p-3 rounded-lg backdrop-blur">
                    <p className={"text-sm font-semibold border-primary"}>{hoveredNode}</p>
                    {nodes.find(n => n.id === hoveredNode)?.location && (
                        <p className={"text-xs text-slate-400"}>
                            {nodes.find(n => n.id === hoveredNode)?.location}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}