'use client';

import {useState} from "react";
import {useIndividual, useNetwork} from "@/hooks/useNetwork";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import NetworkGraph from "@/components/network/NetworkGraph";
import {Activity, AlertTriangle, Badge, Calendar, MapPin, Phone, Users, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {format} from "date-fns";

export default function NetworkPage() {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const {data: networkData, isLoading} = useNetwork(200);
    const {data: selectedIndividual} = useIndividual(selectedNodeId);

    if (isLoading) {
        return (
            <div className={"flex items-center justify-center h-[calc(100vh-200px)]"}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"/>
                    <p className="text-muted-foreground">Loading network visualization...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={"space-y-4"}>
            {/*    Header*/}
            <div className={"flex items-center justify-between"}>
                <div>
                    <h1 className="text-3xl font-bold">Network Visualization</h1>
                    <p className="text-muted-foreground mt-1">
                        Interactive contact network graph • {networkData?.nodes.length || 0} nodes
                        • {networkData?.edges.length || 0} connections
                    </p>
                </div>
            </div>

            {/*    Main Content*/}
            <div className={"grid gap-4 lg:grid-cols-4"}>
                {/*    Network Graph - Takes 3 columns*/}
                <div className={"lg:col-span-3"}>
                    <Card>
                        <CardContent className={"p-0"}>
                            {networkData && networkData.nodes.length > 0 ? (
                                <NetworkGraph nodes={networkData.nodes} edges={networkData.edges} width={1200}
                                              height={700} onNodeClick={(node) => setSelectedNodeId(node.id)}
                                              selectedNodeId={selectedNodeId}/>
                            ) : (
                                <div className={"flex items-center justify-center h-[700px] rounded-lg"}>
                                    <div className={"text-center"}>
                                        <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground"/>
                                        <p className="text-muted-foreground">No network data available</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Add individuals and contacts to see the network
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/*    Details Panel - 1 column*/}
                <div className={"lg:col-span-1"}>
                    {selectedNodeId && selectedIndividual ? (
                        <Card className={"sticky top-4"}>
                            <CardHeader className={"flex items-center justify-between pb-3"}>
                                <CardTitle className={"text-lg"}>Node Details</CardTitle>
                                <Button
                                    variant={"ghost"}
                                    size={"sm"}
                                    onClick={() => setSelectedNodeId(null)}
                                    className={"h-8 w-8 p-0"}
                                >
                                    <X className={"w-4 h-4"}/>
                                </Button>
                            </CardHeader>
                            <CardContent className={"space-y-4"}>
                                {/*    Status Badge*/}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge
                                        className={
                                            selectedIndividual.infected
                                                ? 'bg-destructive/15 text-destructive border-destructive/30'
                                                : 'bg-chart-4/20 text-chart-4 border-chart-4/30'
                                        }
                                    >
                                        {selectedIndividual.infected ? 'INFECTED' : 'HEALTHY'}
                                    </Badge>
                                </div>

                                {/*    ID*/}
                                <div>
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Users className="w-4 h-4"/>
                                        <span className="text-xs uppercase tracking-wide">Unique ID</span>
                                    </div>
                                    <p className="text-sm font-mono bg-muted px-3 py-2 rounded">
                                        {selectedIndividual.unique_id}
                                    </p>
                                </div>

                                {/*    Phone*/}
                                {selectedIndividual.phone_number && (
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Phone className="w-4 h-4"/>
                                            <span className="text-xs uppercase tracking-wide">Phone</span>
                                        </div>
                                        <p className="text-sm">
                                            {selectedIndividual.phone_number}
                                        </p>
                                    </div>
                                )}

                                {/* Location */}
                                {selectedIndividual.location && (
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <MapPin className="w-4 h-4"/>
                                            <span className="text-xs uppercase tracking-wide">Location</span>
                                        </div>
                                        <p className="text-sm">
                                            {selectedIndividual.location}
                                        </p>
                                    </div>
                                )}

                                {/* Connections */}
                                <div>
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Activity className="w-4 h-4"/>
                                        <span className="text-xs uppercase tracking-wide">Connections</span>
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {selectedIndividual.contact_count}
                                    </p>
                                </div>

                                {/*   Risk Score */}
                                {selectedIndividual.risk_score != null && (
                                    <div>
                                        <div className={"flex items-center gap-2 text-muted-foreground mb-2"}>
                                            <AlertTriangle className={"w-4 h-4"}/>
                                            <span className={"text-xs uppercase tracking-wide"}>Risk Score</span>
                                        </div>
                                        <div className={"space-y-2"}>
                                            <div className={"flex items-center justify-between"}>
                                                <span className="text-2xl font-bold">
                                                    {(selectedIndividual.risk_score * 100).toFixed(0)}%
                                                </span>
                                                <Badge
                                                    className={
                                                        selectedIndividual.risk_score > 0.7
                                                            ? 'bg-destructive/15 text-destructive border-destructive/30'
                                                            : selectedIndividual.risk_score > 0.4
                                                                ? 'bg-chart-2/20 text-chart-2 border-chart-2/30'
                                                                : 'bg-chart-4/20 text-chart-4 border-chart-4/30'
                                                    }
                                                >
                                                    {selectedIndividual.risk_score > 0.7 ? 'HIGH' :
                                                        selectedIndividual.risk_score > 0.4 ? 'MEDIUM' : 'LOW'}
                                                </Badge>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${
                                                        selectedIndividual.risk_score > 0.7 ? 'bg-destructive' :
                                                            selectedIndividual.risk_score > 0.4 ? 'bg-chart-2' :
                                                                'bg-chart-4'
                                                    }`}
                                                    style={{width: `${selectedIndividual.risk_score * 100}%`}}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/*    Infection Date*/}
                                {selectedIndividual.infected && selectedIndividual.infection_date && (
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Calendar className="w-4 h-4"/>
                                            <span className="text-xs uppercase tracking-wide">Infected Since</span>
                                        </div>
                                        <p className="text-sm">
                                            {format(new Date(selectedIndividual.infection_date), 'PPP')}
                                        </p>
                                    </div>
                                )}

                                {/* Severity */}
                                {selectedIndividual.severity && (
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <AlertTriangle className="w-4 h-4"/>
                                            <span className="text-xs uppercase tracking-wide">Severity</span>
                                        </div>
                                        <Badge className="bg-chart-1/20 text-chart-1 border-chart-1/30">
                                            {selectedIndividual.severity.toUpperCase()}
                                        </Badge>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="pt-4 space-y-2 border-t border-border">
                                    <Button
                                        className="w-full"
                                        onClick={() => window.location.href = `/trace?id=${selectedNodeId}`}
                                    >
                                        Trace Contacts
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setSelectedNodeId(null)}
                                    >
                                        Close Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="sticky top-4">
                            <CardContent className="flex items-center justify-center h-[500px]">
                                <div className="text-center">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground"/>
                                    <p className="text-sm text-muted-foreground">Click a node to view details</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}