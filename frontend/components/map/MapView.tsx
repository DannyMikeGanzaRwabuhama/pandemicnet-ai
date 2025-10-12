'use client';

import {useEffect, useRef} from "react";
import L, {Browser} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {NetworkNode, NetworkEdge} from "@/lib/types";
import edge = Browser.edge;

// Fix for default marker icons in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    onNodeClick: (node: NetworkNode) => void;
}

// Mock coordinated for demonstration (in production, use real geocoding)
const getCoordinated = (location?: string): [number, number] => {
    const locations: Record<string, [number, number]> = {
        'Kigali': [-1.9536, 30.0606],
        'Butare': [-2.5967, 29.7392],
        'Gisenyi': [-1.7039, 29.2564],
        'Rwamagana': [-1.9497, 30.4347],
        'Musanze': [-1.4992, 29.6364],
    };

    if (location && locations[location]) {
        // Add small random offset for clustering
        return [
            locations[location][0] + (Math.random() - 0.5) * 0.1,
            locations[location][1] + (Math.random() - 0.5) * 0.1,
        ];
    }

    // Default to Rwanda center with random offset
    return [
        -1.9403 + (Math.random() - 0.5) * 2,
        29.8739 + (Math.random() - 0.5) * 2,
    ];
};

export default function MapView({nodes, edges, onNodeClick}: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Initialize map centered on Rwanda
        const map = L.map(mapContainerRef.current).setView([-1.9403, 29.8739], 8);
        mapRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        // Clear existing layers (except base layer)
        map.eachLayer((layer) => {
            if (layer instanceof L.marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        // Create a map of node coordinates
        const nodeCoords = new Map<string, [number, number]>();

        // Add markers for each node
        nodes.forEach((node) => {
            const coords = getCoordinates(node.location);
            nodeCoords.set(node.id, coords);

            // Determine marker color based on infection status
            const color = node.infected ? '#EF4444' :
                node.risk_score && node.risk_score > 0.7 ? '#F97316' :
                    node.risk_score && node.risk_score > 0.4 ? '#EAB308' :
                        '#22C55E';

            // Create custom icon
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `
          <div style="
            width: ${12 + node.connections}px;
            height: ${12 + node.connections}px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
                iconSize: [12 + node.connections, 12 + node.connections],
                iconAnchor: [(12 + node.connections) / 2, (12 + node.connections) / 2],
            });

            const marker = L.marker(coords, {icon})
                .bindPopup(`
          <div style="font-family: sans-serif; min-width: 150px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              ${node.id}
            </h3>
            <div style="font-size: 12px; color: #666;">
              <p style="margin: 4px 0;">
                <strong>Status:</strong> 
                <span style="color: ${node.infected ? '#EF4444' : '#22C55E'}">
                  ${node.infected ? 'Infected' : 'Healthy'}
                </span>
              </p>
              ${node.location ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${node.location}</p>` : ''}
              <p style="margin: 4px 0;"><strong>Connections:</strong> ${node.connections}</p>
              ${node.risk_score ? `
                <p style="margin: 4px 0;">
                  <strong>Risk:</strong> ${(node.risk_score * 100).toFixed(0)}%
                </p>
              ` : ''}
               </div>
               </div>
               `)
                .addTo(map);

            marker.on('click', () => {
                onNodeClick?.(node);
            });
        });

        // Draw connections between nodes
        edges.forEach((edge) => {
            const sourceCoords = nodeCoords.get(edge.source);
            const targetCoords = nodeCoords.get(edge.target);

            if (sourceCoords && targetCoords) {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                const isInfectedConnection = sourceNode?.infected || targetNode?.infected;

                L.polyline([sourceCoords, targetCoords], {
                    color: isInfectedConnection ? '#EF4444' : '#64748B',
                    weight: edge.proximity === 'close' ? 2.5 : edge.proximity === 'medium' ? 1.5 : 1,
                    opacity: isInfectedConnection ? 0.6 : 0.3,
                    dashArray: edge.proximity === 'far' ? '5, 5' : undefined,
                }).addTo(map);
            }
        });

        // Fit bounds to show all markers
        if (nodes.length > 0) {
            const bounds = L.latLngBounds(Array.from(nodeCoords.values()));
            map.fitBounds(bounds, {padding: [50, 50]});
        }
    }, [nodes, edges, onNodeClick]);

    return (
        <div
            ref={mapContainerRef}
            className={"w-full h-full rounded-lg overflow-hidden"}
            style={{minHeight: '600px'}}
        />
    )
}