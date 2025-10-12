'use client';


import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useNetworkStats, useSuperspreaders} from '@/hooks/useNetwork';
import {Users, Activity, AlertTriangle, TrendingUp, Map, BarChart3, Search} from 'lucide-react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';

function MetricCard({
                        title,
                        value,
                        subtitle,
                        icon: Icon,
                        trend,
                        color = 'blue'
                    }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: { value: number; label: string };
    color?: 'blue' | 'red' | 'orange' | 'green'
}) {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
    };

    return (
        <Card className={"bg-slate-900 border-slate-800"}>
            <CardHeader className={"flex items-center justify-between pb-2"}>
                <CardTitle className={"text-sm font-medium text-slate-400"}>
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
                    <Icon className={"w-4 h-4"}/>
                </div>
            </CardHeader>
            <CardContent>
                <div className={"text-3xl font-bold text-slate-100"}>{value}</div>
                {subtitle && (
                    <p className={"text-xs text-slate-500 mt-1"}>{subtitle}</p>
                )}
                {trend && (
                    <div className="flex items-center mt-2 text-xs">
                        <TrendingUp className={`w-3 h-3 mr-1 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}/>
                        <span className={trend.value >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {trend.value >= 0 ? '+' : ''}{trend.value}%
                        </span>
                        <span className="text-slate-500 ml-1">{trend.label}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
    const {data: stats, isLoading: statsLoading} = useNetworkStats();
    const {data: superspreaders} = useSuperspreaders(5);

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"/>
                    <p className="text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const infectionRate = stats ? ((stats.infected_count / stats.total_individuals) * 100).toFixed(1) : '0';

    return (
        <div className={"space-y-6"}>
            {/*    Header*/}
            <div className={"flex items-center justify-between"}>
                <div>
                    <h1 className={"text-3xl font-bold text-slate-100"}>Dashboard</h1>
                    <p className="text-slate-400 mt-1">
                        Real-time pandemic monitoring and contact tracing overview
                    </p>
                </div>
                <div className={"flex gap-2"}>
                    <Link href={"/trace"}>
                        <Button variant={"outline"} className={"border-slate-700"}>
                            Trace Contacts
                        </Button>
                    </Link>
                    <Link href={"/network"}>
                        <Button className={"bg-blue-600 hover:bg-blue-700"}>
                            View Network
                        </Button>
                    </Link>
                </div>
            </div>

            {/*    Metrics Grid*/}
            <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-4"}>
                <MetricCard
                    title={"Total Individuals"}
                    value={stats?.total_individuals || 0}
                    subtitle={"In network"}
                    icon={Users}
                    color={"blue"}
                />
                <MetricCard
                    title="Infected Cases"
                    value={stats?.infected_count || 0}
                    subtitle={`${infectionRate}% infection rate`}
                    icon={AlertTriangle}
                    color="red"
                />
                <MetricCard
                    title="Total Contacts"
                    value={stats?.total_contacts || 0}
                    subtitle="Recorded interactions"
                    icon={Activity}
                    color="green"
                />
                <MetricCard
                    title="Avg. Connections"
                    value={stats?.average_contacts?.toFixed(1) || '0'}
                    subtitle="Per individual"
                    icon={TrendingUp}
                    color="orange"
                />
            </div>

            {/*    Main Content Grid*/}
            <div className={"grid gap-6 lg:grid-cols-3"}>
                {/*    Network Overview*/}
                <Card className={"lg:col-span-2 bg-slate-900 border-slate-800"}>
                    <CardHeader>
                        <CardTitle className={"text-slate-100"}>Network Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={"space-y-4"}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Network Density</span>
                                <span className="text-sm font-semibold text-slate-100">
                                  {stats?.density?.toFixed(3) || 'N/A'}
                                </span>
                            </div>
                            <div className={"w-full bg-slate-800 rounded-full h-2"}>
                                <div
                                    className={"bg-blue-500 h-2 rounded-full transition-all"}
                                    style={{width: `${((stats?.density || 0) * 100).toFixed(1)}%`}}
                                />
                            </div>

                            <div className={"flex items-center justify-between pt-2"}>
                                <span className="text-sm text-slate-400">Max Degrees of Separation</span>
                                <span className="text-sm font-semibold text-slate-100">
                                  {stats?.max_degree_separation || 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Network Clusters</span>
                                <span className="text-sm font-semibold text-slate-100">
                                  {stats?.clusters || 0}
                                </span>
                            </div>

                            <div className={"pt-4"}>
                                <Link href={"/analytics"}>
                                    <Button variant={"outline"} className={"w-full border-slate-700"}>
                                        View Detailed Analytics
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/*    Superspreaders Alert*/}
                <Card className={"bg-slate-900 border-slate-800"}>
                    <CardHeader>
                        <CardTitle className={"text-slate-100 flex items-center gap-2"}>
                            <AlertTriangle className={"w-5 h-5 text-orange-500"}/>
                            Superspreaders
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {superspreaders && superspreaders.length > 0 ? (
                            <div className={"space-y-3"}>
                                {superspreaders.slice(0, 5).map((spreader: any) => (
                                    <div
                                        key={spreader.unique_id}
                                        className={"flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-100 truncate">
                                                {spreader.unique_id}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {spreader.location || 'Unknown location'}
                                            </p>
                                        </div>
                                        <div className={"text-right ml-2"}>
                                            <p className={"text-sm font-bold text-orange-500"}>
                                                {spreader.contact_count}
                                            </p>
                                            <p className={"text-xs text-slate-500"}>contacts</p>
                                        </div>
                                    </div>
                                ))}
                                <Link href="/trace">
                                    <Button variant="outline" className="w-full border-slate-700 mt-2">
                                        Trace All Contacts
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <AlertTriangle className="w-12 h-12 text-slate-700 mx-auto mb-2"/>
                                <p className="text-sm text-slate-400">No superspreaders detected</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/*    Quick Actions*/}
            <Card className={"bg-slate-900 border-slate-800"}>
                <CardHeader>
                    <CardTitle className="text-slate-100">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={"grid gap-4 sm:grid-cols-2 lg:grid-cols-4"}>
                        <Link href={"/network"}>
                            <Button variant={"outline"} className={"w-full h-20 border-slate-700 flex flex-col gap-2"}>
                                <Activity className={"w-6 h-6"}/>
                                <span>View Network Graph</span>
                            </Button>
                        </Link>
                        <Link href="/map">
                            <Button variant="outline" className="w-full h-20 border-slate-700 flex flex-col gap-2">
                                <Map className="w-6 h-6"/>
                                <span>Geographic View</span>
                            </Button>
                        </Link>
                        <Link href="/trace">
                            <Button variant="outline" className="w-full h-20 border-slate-700 flex flex-col gap-2">
                                <Search className="w-6 h-6"/>
                                <span>Trace Contacts</span>
                            </Button>
                        </Link>
                        <Link href="/analytics">
                            <Button variant="outline" className="w-full h-20 border-slate-700 flex flex-col gap-2">
                                <BarChart3 className="w-6 h-6"/>
                                <span>View Analytics</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}