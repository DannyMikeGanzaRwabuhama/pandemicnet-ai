'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {useNetworkStats, useSuperspreaders} from '@/hooks/useNetwork';
import {
    InfectionTrendChart,
    NetworkDistributionChart,
    RiskDistributionChart,
    ContactFrequencyChart,
} from '@/components/charts/InfectionTrendChart';

import {
    Users,
    Activity,
    AlertTriangle,
    TrendingUp,
    Network,
} from 'lucide-react';
import Link from 'next/link';

// =======================================
// Metric Card
// =======================================
function MetricCard({
                        title,
                        value,
                        subtitle,
                        icon: Icon,
                        trend,
                        variant = 'default',
                    }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: { value: number; label: string };
    variant?: 'default' | 'destructive' | 'success' | 'warning';
}) {
    const variantStyles = {
        default: 'bg-primary/10 text-primary border-primary/20',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        success: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
        warning: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
    };

    return (
        <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-lg border ${variantStyles[variant]}`}>
                    <Icon className="w-4 h-4"/>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-foreground">{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                {trend && (
                    <div className="flex items-center mt-2 text-xs">
                        <TrendingUp
                            className={`w-3 h-3 mr-1 ${
                                trend.value >= 0 ? 'text-chart-4' : 'text-destructive'
                            }`}
                        />
                        <span className={trend.value >= 0 ? 'text-chart-4' : 'text-destructive'}>
              {trend.value >= 0 ? '+' : ''}
                            {trend.value}%
            </span>
                        <span className="text-muted-foreground ml-1">{trend.label}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =======================================
// Dashboard
// =======================================
export default function Dashboard() {
    const {data: statsData, isLoading: statsLoading} = useNetworkStats();
    const {data: superspreaders} = useSuperspreaders(5);

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"/>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = statsData?.statistics;
    const aiInsights = statsData?.ai_insights;

    const infectionRate =
        stats?.infected_count && stats?.total_individuals
            ? ((stats.infected_count / stats.total_individuals) * 100).toFixed(1)
            : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time pandemic monitoring and contact tracing overview
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/trace">
                        <Button variant="secondary">Trace Contacts</Button>
                    </Link>
                    <Link href="/network">
                        <Button variant={"default"}>View Network</Button>
                    </Link>
                </div>
            </div>

            {/*/!* ✅ AI Insights *!/*/}
            {/*{aiInsights && (*/}
            {/*    <Card className="border-border">*/}
            {/*        <CardHeader className="flex items-center gap-2">*/}
            {/*            <Brain className="w-5 h-5 text-primary"/>*/}
            {/*            <CardTitle>AI Insights</CardTitle>*/}
            {/*        </CardHeader>*/}
            {/*        <CardContent>*/}
            {/*            <p className="text-sm text-muted-foreground">{aiInsights}</p>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*)}*/}

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Individuals"
                    value={stats?.total_individuals || 0}
                    subtitle="In network"
                    icon={Users}
                    trend={{value: 12, label: 'vs last week'}}
                />
                <MetricCard
                    title="Infected Cases"
                    value={stats?.infected_count || 0}
                    subtitle={`${infectionRate}% infection rate`}
                    icon={AlertTriangle}
                    variant="destructive"
                    trend={{value: -5, label: 'vs last week'}}
                />
                <MetricCard
                    title="Total Contacts"
                    value={stats?.total_contacts || 0}
                    subtitle="Recorded interactions"
                    icon={Activity}
                    variant="success"
                    trend={{value: 8, label: 'vs last week'}}
                />
                <MetricCard
                    title="Avg. Connections"
                    value={stats?.average_contacts?.toFixed(1) || '0'}
                    subtitle="Per individual"
                    icon={TrendingUp}
                    variant="warning"
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary"/>
                            Infection Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <InfectionTrendChart/>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive"/>
                            Risk Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RiskDistributionChart/>
                    </CardContent>
                </Card>
            </div>

            {/* Network + Superspreaders */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Network className="w-5 h-5 text-primary"/>
                            Network Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <NetworkDistributionChart/>
                    </CardContent>
                </Card>

                {/*<Card className="bg-card border-border">*/}
                {/*    <CardHeader>*/}
                {/*        <CardTitle className="text-foreground flex items-center gap-2">*/}
                {/*            <AlertTriangle className="w-5 h-5 text-chart-2"/>*/}
                {/*            Superspreaders*/}
                {/*        </CardTitle>*/}
                {/*    </CardHeader>*/}
                {/*    <CardContent>*/}
                {/*        {superspreaders && superspreaders.length > 0 ? (*/}
                {/*            <div className="space-y-3">*/}
                {/*                {superspreaders.map((spreader: any) => (*/}
                {/*                    <div*/}
                {/*                        key={spreader.unique_id}*/}
                {/*                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"*/}
                {/*                    >*/}
                {/*                        <div className="flex-1 min-w-0">*/}
                {/*                            <p className="text-sm font-medium text-foreground truncate">*/}
                {/*                                {spreader.unique_id}*/}
                {/*                            </p>*/}
                {/*                            <p className="text-xs text-muted-foreground">*/}
                {/*                                {spreader.location || 'Unknown'}*/}
                {/*                            </p>*/}
                {/*                        </div>*/}
                {/*                        <div className="text-right ml-2">*/}
                {/*                            <p className="text-sm font-bold text-chart-2">*/}
                {/*                                {spreader.contact_count}*/}
                {/*                            </p>*/}
                {/*                            <p className="text-xs text-muted-foreground">contacts</p>*/}
                {/*                        </div>*/}
                {/*                    </div>*/}
                {/*                ))}*/}
                {/*            </div>*/}
                {/*        ) : (*/}
                {/*            <div className="text-center py-8">*/}
                {/*                <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-2"/>*/}
                {/*                <p className="text-sm text-muted-foreground">*/}
                {/*                    No superspreaders detected*/}
                {/*                </p>*/}
                {/*            </div>*/}
                {/*        )}*/}
                {/*    </CardContent>*/}
                {/*</Card>*/}
            </div>

            {/* Contact Frequency */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary"/>
                        Contact Frequency
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ContactFrequencyChart/>
                </CardContent>
            </Card>
        </div>
    );
}
