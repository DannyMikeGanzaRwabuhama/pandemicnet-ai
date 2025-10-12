'use client';

// Dynamically import MapView to avoid SSR issues with Leaflet
import dynamic from "next/dynamic";
import {useState} from "react";
import {NetworkNode} from "@/lib/types";
import {useNetwork} from "@/hooks/useNetwork";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Activity, Badge, MapPin, Users} from "lucide-react";

const MapView = dynamic(
    () => import('@/components/map/MapView'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[600px] bg-slate-900 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"/>
                    <p className="text-slate-400">Loading map...</p>
                </div>
            </div>
        )
    }
);

export default function MapPage() {
    const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
    const {data: networkData, isLoading} = useNetwork(200);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"/>
                    <p className="text-slate-400">Loading geographic data...</p>
                </div>
            </div>
        );
    }

    // Group nodes by location for statistics
    const locationStats = networkData?.nodes.reduce((acc, node) => {
        const location = node.location || 'Unknown';
        if (!acc[location]) {
            acc[location] = {total: 0, infected: 0};
        }
        acc[location].total++;
        if (node.infected) acc[location].infected++;
        return acc;
    }, {} as Record<string, { total: number; infected: number }>);

    return (
        <div className={"space-y-4"}>
            {/*    Header*/}
            <div>
                <h1 className="text-3xl font-bold text-slate-100">Geographic View</h1>
                <p className="text-slate-400 mt-1">
                    Contact network mapped by location • {networkData?.nodes.length || 0} individuals
                </p>
            </div>

            {/*    Main Content*/}
            <div className={"grid gap-4 lg:grid-cols-4"}>
                {/*    Map - 3 columns*/}
                <div className={"lg:col-span-3"}>
                    <Card className={"bg-slate-900 border-slate-800"}>
                        <CardContent className={"p-4"}>
                            {networkData && networkData.nodes.length > 0 ? (
                                <MapView
                                    nodes={networkData.nodes}
                                    edges={networkData.edges}
                                    onNodeClick={setSelectedNode}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-[600px]">
                                    <div className="text-center">
                                        <MapPin className="w-16 h-16 text-slate-700 mx-auto mb-4"/>
                                        <p className="text-slate-400">No geographic data available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/*    Map Legend*/}
                    <Card className={"bg-slate-900 border-slate-800 mt-4"}>
                        <CardHeader>
                            <CardTitle className={"text-sm text-slate-100"}>Map Legend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"/>
                                    <span className="text-xs text-slate-300">Infected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"/>
                                    <span className="text-xs text-slate-300">High Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"/>
                                    <span className="text-xs text-slate-300">Medium Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"/>
                                    <span className="text-xs text-slate-300">Healthy</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <p className="text-xs text-slate-400">
                                    • Marker size indicates number of connections<br/>
                                    • Solid lines: close proximity • Dashed lines: far proximity<br/>
                                    • Click markers for details • Zoom and pan to explore
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/*    Sidebar - 1 column*/}
                <div className={"lg:col-span-1 space-y-4"}>
                    {/*    Location Statistics */}
                    <Card className={"bg-slate-900 border-slate-800"}>
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                                <MapPin className="w-5 h-5"/>
                                Locations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {locationStats && Object.keys(locationStats).length > 0 ? (
                                <div className={"space-y-3"}>
                                    {Object.entries(locationStats)
                                        .sort(([, a], [, b]) => b.total - a.total)
                                        .map(([location, stats]) => (
                                            <div
                                                key={location}
                                                className={"p-3 bg-slate-800/50 rounded-lg border border-slate-700"}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-medium text-slate-100">
                                                        {location}
                                                    </p>
                                                    <Badge className="border-slate-600">
                                                        {stats.total}
                                                    </Badge>
                                                </div>
                                                {stats.infected > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                                                            <div
                                                                className="bg-red-500 h-1.5 rounded-full"
                                                                style={{width: `${(stats.infected / stats.total) * 100}%`}}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-red-400">
                                                          {stats.infected} infected
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className={"text-center py-4"}>
                                    <MapPin className={"w-8 h-8 text-slate-700 mx-auto mb-2"}/>
                                    <p className={"text-xs text-slate-400"}>No location data</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/*    Selected Node Details*/}
                    {selectedNode && (
                        <Card className={"bg-slate-900 border-slate-800"}>
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-100">Selected Node</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Users className="w-4 h-4"/>
                                        <span className="text-xs uppercase tracking-wide">ID</span>
                                    </div>
                                    <p className="text-sm font-mono text-slate-100 bg-slate-800 px-3 py-2 rounded">
                                        {selectedNode.id}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Status</span>
                                    <Badge
                                        className={
                                            selectedNode.infected
                                                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                                : 'bg-green-500/20 text-green-400 border-green-500/50'
                                        }
                                    >
                                        {selectedNode.infected ? 'INFECTED' : 'HEALTHY'}
                                    </Badge>
                                </div>

                                {selectedNode.location && (
                                    <div>
                                        <div className={"flex items-center gap-2 text-slate-400 mb-1"}>
                                            <MapPin className={"w-4 h-4"}/>
                                            <span className={"text-xs uppercase tracking-wide"}>Location</span>
                                        </div>
                                        <p className={"text-sm text-slate-100"}>{selectedNode.location}</p>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Activity className="w-4 h-4"/>
                                        <span className="text-xs uppercase tracking-wide">Connections</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-100">
                                        {selectedNode.connections}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/*    Quick Stats*/}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Total Nodes</span>
                                <span className="text-lg font-bold text-slate-100">
                                  {networkData?.nodes.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Connections</span>
                                <span className="text-lg font-bold text-slate-100">
                                  {networkData?.edges.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Locations</span>
                                <span className="text-lg font-bold text-slate-100">
                                  {locationStats ? Object.keys(locationStats).length : 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}