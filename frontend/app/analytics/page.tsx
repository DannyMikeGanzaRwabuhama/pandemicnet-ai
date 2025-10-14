// AnalyticsPage.tsx
'use client';

import {useQuery} from "@tanstack/react-query";
import {api} from "@/lib/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {TrendingUp, Network, AlertCircle} from "lucide-react";
import {CentralityNode, Community, Superspreader, NetworkStats} from "@/lib/types";
import {DataTable, superspreaderColumns} from "@/components/DataTable"; // <-- import

export default function AnalyticsPage() {
    const {data: stats} = useQuery<NetworkStats>({
        queryKey: ["network-stats"],
        queryFn: api.getNetworkStats,
    });

    const {data: centrality} = useQuery<CentralityNode[]>({
        queryKey: ["centrality"],
        queryFn: () => api.getCentrality(10),
    });

    const {data: communities} = useQuery<Community[]>({
        queryKey: ["communities"],
        queryFn: api.getCommunities,
    });

    const {data: superspreaders} = useQuery<Superspreader[]>({
        queryKey: ["superspreaders"],
        queryFn: () => api.getSuperspreaders(50), // fetch more for table
    });

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold">Network Analytics</h1>
                <p className="mt-1 text-muted-foreground">
                    Deep dive into network structure and key infection dynamics
                </p>
            </header>

            {/* Overview Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Network Density" value={stats?.statistics.density?.toFixed(3) || "0.000"}
                            hint="Connectedness measure"/>
                <MetricCard title="Avg Connections" value={stats?.statistics.average_contacts?.toFixed(1) || "0"}
                            hint="Per individual"/>
                <MetricCard title="Communities" value={communities?.length || 0} hint="Detected clusters"/>
                <MetricCard title="Infected Count" value={stats?.statistics.infected_count || 0}
                            hint="Confirmed cases"/>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <CentralitySection centrality={centrality}/>
                <CommunitiesSection communities={communities}/>
            </div>

            {/* Superspreaders Table Section */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500"/>
                        Superspreader Table
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {superspreaders?.length ? (
                        <DataTable
                            data={superspreaders}
                            columns={superspreaderColumns}
                            filterColumn="unique_id"
                            title="Superspreaders Overview"
                        />
                    ) : (
                        <EmptyState icon={AlertCircle} label="No superspreaders detected"/>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* --- Subcomponents reused from before --- */
function MetricCard({title, value, hint}: { title: string; value: string | number; hint?: string }) {
    return (
        <Card className="bg-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{value}</p>
                {hint && <p className="text-xs mt-1 text-muted-foreground">{hint}</p>}
            </CardContent>
        </Card>
    );
}

function CentralitySection({centrality}: { centrality?: CentralityNode[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5"/>
                    Top Central Nodes
                </CardTitle>
            </CardHeader>
            <CardContent>
                {centrality?.length ? (
                    <div className="space-y-3">
                        {centrality.map((node, idx) => (
                            <div key={node.unique_id}
                                 className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            className="bg-blue-500/20 text-blue-400 border-blue-500/50">#{idx + 1}</Badge>
                                        <span className="font-semibold text-slate-100">{node.unique_id}</span>
                                    </div>
                                    <Badge variant="outline"
                                           className="border-slate-600">{node.degree} connections</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <Metric label="Betweenness" value={node.betweenness}/>
                                    <Metric label="Closeness" value={node.closeness}/>
                                    <Metric label="Eigenvector" value={node.eigenvector}/>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={TrendingUp} label="No centrality data available"/>
                )}
            </CardContent>
        </Card>
    );
}

function CommunitiesSection({communities}: { communities?: Community[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5"/>
                    Community Detection
                </CardTitle>
            </CardHeader>
            <CardContent>
                {communities?.length ? (
                    <div className="space-y-3">
                        {communities.slice(0, 10).map((community) => (
                            <div key={community.community_id}
                                 className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                                        Community {community.community_id}
                                    </Badge>
                                    <span className="text-sm text-slate-100">{community.size} members</span>
                                </div>
                                {community.infected_count > 0 && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <AlertCircle className="w-3 h-3 text-red-400"/>
                                        <span className="text-red-400">{community.infected_count} infected</span>
                                        <span
                                            className="text-slate-500">({(community.infection_rate * 100).toFixed(1)}%)</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={Network} label="No communities detected"/>
                )}
            </CardContent>
        </Card>
    );
}

function Metric({label, value}: { label: string; value: number }) {
    return (
        <div>
            <span className="text-slate-500">{label}</span>
            <p className="text-slate-300 font-semibold">{value.toFixed(3)}</p>
        </div>
    );
}

function EmptyState({icon: Icon, label}: { icon: any; label: string }) {
    return (
        <div className="text-center py-8">
            <Icon className="w-12 h-12 text-slate-700 mx-auto mb-2"/>
            <p className="text-sm text-slate-400">{label}</p>
        </div>
    );
}
