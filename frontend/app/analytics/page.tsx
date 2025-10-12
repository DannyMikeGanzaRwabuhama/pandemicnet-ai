'use client';

import {useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {
    BarChart3,
    Network,
    TrendingUp,
    AlertCircle
} from 'lucide-react';

export default function AnalyticsPage() {
    const {data: stats} = useQuery({
        queryKey: ['network-stats'],
        queryFn: () => api.getNetworkStats(),
    });

    const {data: centrality} = useQuery({
        queryKey: ['centrality'],
        queryFn: () => api.getCentrality(15),
    });

    const {data: communities} = useQuery({
        queryKey: ['communities'],
        queryFn: () => api.getCommunities(),
    });

    const {data: superspreaders} = useQuery({
        queryKey: ['superspreaders'],
        queryFn: () => api.getSuperspreaders(5),
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-100">Network Analytics</h1>
                <p className="text-slate-400 mt-1">
                    Deep dive into network structure and key metrics
                </p>
            </div>

            {/* Overview Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-400">Network Density</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-slate-100">
                            {stats?.density?.toFixed(3) || '0.000'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Connectedness measure</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-400">Avg Connections</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-slate-100">
                            {stats?.average_contacts?.toFixed(1) || '0'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Per individual</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-400">Communities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-slate-100">
                            {communities?.length || 0}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Detected clusters</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-400">Max Separation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-slate-100">
                            {stats?.max_degree_separation || 0}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Degrees</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Centrality Analysis */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5"/>
                            Top Central Nodes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {centrality && centrality.length > 0 ? (
                            <div className="space-y-3">
                                {centrality.map((node: any, idx: number) => (
                                    <div
                                        key={node.unique_id}
                                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                                    #{idx + 1}
                                                </Badge>
                                                <span className="font-semibold text-slate-100">
                          {node.unique_id}
                        </span>
                                            </div>
                                            <Badge variant="outline" className="border-slate-600">
                                                {node.degree} connections
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <span className="text-slate-500">Betweenness</span>
                                                <p className="text-slate-300 font-semibold">
                                                    {node.betweenness.toFixed(3)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Closeness</span>
                                                <p className="text-slate-300 font-semibold">
                                                    {node.closeness.toFixed(3)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Eigenvector</span>
                                                <p className="text-slate-300 font-semibold">
                                                    {node.eigenvector.toFixed(3)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-2"/>
                                <p className="text-sm text-slate-400">No centrality data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Communities */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <Network className="w-5 h-5"/>
                            Community Detection
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {communities && communities.length > 0 ? (
                            <div className="space-y-3">
                                {communities.slice(0, 10).map((community: any) => (
                                    <div
                                        key={community.community_id}
                                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                                                    Community {community.community_id}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-100">
                                                    {community.size} members
                                                </p>
                                            </div>
                                        </div>

                                        {community.infected_count > 0 && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <AlertCircle className="w-3 h-3 text-red-400"/>
                                                <span className="text-red-400">
                          {community.infected_count} infected
                        </span>
                                                <span className="text-slate-500">
                          ({(community.infection_rate * 100).toFixed(1)}% rate)
                        </span>
                                            </div>
                                        )}

                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {community.members.slice(0, 5).map((member: string) => (
                                                <Badge
                                                    key={member}
                                                    variant="outline"
                                                    className="text-xs border-slate-600"
                                                >
                                                    {member}
                                                </Badge>
                                            ))}
                                            {community.members.length > 5 && (
                                                <Badge variant="outline" className="text-xs border-slate-600">
                                                    +{community.members.length - 5}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Network className="w-12 h-12 text-slate-700 mx-auto mb-2"/>
                                <p className="text-sm text-slate-400">No communities detected</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Superspreaders */}
                <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500"/>
                            Superspreader Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {superspreaders && superspreaders.length > 0 ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {superspreaders.map((spreader: any) => (
                                    <div
                                        key={spreader.unique_id}
                                        className="p-4 bg-slate-800/50 rounded-lg border border-orange-500/30"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-100 mb-1">
                                                    {spreader.unique_id}
                                                </p>
                                                {spreader.location && (
                                                    <p className="text-xs text-slate-400">{spreader.location}</p>
                                                )}
                                            </div>
                                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                                                SUPERSPREADER
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-slate-500">Total Contacts</p>
                                                <p className="text-2xl font-bold text-orange-400">
                                                    {spreader.contact_count}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Infected Contacts</p>
                                                <p className="text-2xl font-bold text-red-400">
                                                    {spreader.infected_contacts}
                                                </p>
                                            </div>
                                        </div>

                                        {spreader.centrality_score && (
                                            <div className="mt-3 pt-3 border-t border-slate-700">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Centrality Score</span>
                                                    <span className="text-slate-300 font-semibold">
                            {spreader.centrality_score.toFixed(3)}
                          </span>
                                                </div>
                                                <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className="bg-orange-500 h-1.5 rounded-full"
                                                        style={{width: `${spreader.centrality_score * 100}%`}}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-2"/>
                                <p className="text-sm text-slate-400">No superspreaders detected</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Network Health Summary */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-100 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5"/>
                        Network Health Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-400 mb-3">Structure</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Total Individuals</span>
                                    <span className="text-slate-100 font-semibold">
                    {stats?.total_individuals || 0}
                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Total Contacts</span>
                                    <span className="text-slate-100 font-semibold">
                    {stats?.total_contacts || 0}
                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Network Density</span>
                                    <span className="text-slate-100 font-semibold">
                    {stats?.density?.toFixed(3) || '0.000'}
                  </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-slate-400 mb-3">Infection</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Infected Count</span>
                                    <span className="text-red-400 font-semibold">
                    {stats?.infected_count || 0}
                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Infection Rate</span>
                                    <span className="text-red-400 font-semibold">
                    {stats?.infection_rate
                        ? `${(stats.infection_rate * 100).toFixed(1)}%`
                        : '0%'
                    }
                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Superspreaders</span>
                                    <span className="text-orange-400 font-semibold">
                    {superspreaders?.length || 0}
                  </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-slate-400 mb-3">Topology</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Communities</span>
                                    <span className="text-slate-100 font-semibold">
                    {communities?.length || 0}
                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Max Separation</span>
                                    <span className="text-slate-100 font-semibold">
                    {stats?.max_degree_separation || 0}
                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Avg Connections</span>
                                    <span className="text-slate-100 font-semibold">
                    {stats?.average_contacts?.toFixed(1) || '0'}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}