'use client';

import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '@/lib/api';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Play, Pause, RotateCcw, Settings, TrendingUp, AlertTriangle, Users, Activity} from 'lucide-react';
import SimulationChart from './SimulationChart';
// import AgentConfigPanel from './AgentConfigPanel';

export default function AgentControlDashboard() {
    const queryClient = useQueryClient();
    const [days, setDays] = useState(30);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [showConfig, setShowConfig] = useState(false);

    // Check if agents available
    const {data: agentsAvailable} = useQuery({
        queryKey: ['agents-available'],
        queryFn: () => api.checkAgentsAvailable(),
        retry: false
    });

    // Simulation status query
    const {data: status, refetch: refetchStatus} = useQuery({
        queryKey: ['simulation-status'],
        queryFn: () => api.getSimulationStatus(),
        refetchInterval: (data) => (data?.running ? 2000 : false)
    });

// Latest state query
    const {data: latestState, refetch: refetchLatest} = useQuery({
        queryKey: ['simulation-latest'],
        queryFn: () => api.getLatestSimulationState(),
        enabled: !!status?.has_results,
        refetchInterval: status?.running ? 3000 : false
    });

// Simulation results query
    const {data: results} = useQuery({
        queryKey: ['simulation-results'],
        queryFn: () => api.getSimulationResults(),
        enabled: !!status?.has_results,
        refetchInterval: status?.running ? 5000 : false
    });

    // Mutations
    const startSimulation = useMutation({
        mutationFn: () => api.startSimulation(days, startDate),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['simulation-status']});
            refetchStatus();
        }
    });

    const stopSimulation = useMutation({
        mutationFn: () => api.stopSimulation(),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['simulation-status']});
        }
    });

    const clearResults = useMutation({
        mutationFn: () => api.clearSimulationResults(),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['simulation-status']});
            queryClient.invalidateQueries({queryKey: ['simulation-results']});
            queryClient.invalidateQueries({queryKey: ['simulation-latest']});
        }
    });

    if (!agentsAvailable?.available) {
        return (
            <div className="container mx-auto p-6">
                <Alert className="border-yellow-500">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertDescription>
                        Agent system not available. Install Phase 3 dependencies: pip install -r requirements-agents.txt
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">🤖 AI Agent Control Center</h1>
                    <p className="text-muted-foreground">Autonomous pandemic simulation & analysis</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowConfig(!showConfig)}
                >
                    <Settings className="mr-2 h-4 w-4"/>
                    Configuration
                </Button>
            </div>

            {/* Configuration Panel */}
            {showConfig && (
                <Card>
                    <CardHeader>
                        <CardTitle>Agent Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/*<AgentConfigPanel/>*/}
                    </CardContent>
                </Card>
            )}

            {/* Simulation Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Simulation Controls</CardTitle>
                    <CardDescription>Start, stop, and monitor agent-based simulations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="days">Days to Simulate</Label>
                            <Input
                                id="days"
                                type="number"
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value))}
                                min={1}
                                max={365}
                                disabled={status?.running}
                            />
                        </div>
                        <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                disabled={status?.running}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button
                                onClick={() => startSimulation.mutate()}
                                disabled={status?.running || startSimulation.isPending}
                                className="flex-1"
                            >
                                <Play className="mr-2 h-4 w-4"/>
                                Start Simulation
                            </Button>
                            {status?.running && (
                                <Button
                                    onClick={() => stopSimulation.mutate()}
                                    variant="destructive"
                                >
                                    <Pause className="mr-2 h-4 w-4"/>
                                    Stop
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {status?.running && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress: Day {status.current_day} of {status.total_days}</span>
                                <span>{status.progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={status.progress}/>
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        <Badge variant={status?.running ? "default" : "secondary"}>
                            {status?.running ? "🟢 Running" : "⚪ Idle"}
                        </Badge>
                        {status?.error && (
                            <Badge variant="destructive">Error: {status.error}</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Latest State Overview */}
            {latestState && (
                <>
                    <div className="grid grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Population</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground"/>
                                    <span
                                        className="text-2xl font-bold">{latestState.total_individuals.toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Active Infections</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-red-500"/>
                                    <span
                                        className="text-2xl font-bold text-red-600">{latestState.active_infections}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">R Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <TrendingUp
                                        className={`h-4 w-4 ${latestState.r_value > 1 ? 'text-red-500' : 'text-green-500'}`}/>
                                    <span
                                        className={`text-2xl font-bold ${latestState.r_value > 1 ? 'text-red-600' : 'text-green-600'}`}>
                                        {latestState.r_value.toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Outbreak Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge variant={latestState.outbreak_detected ? "destructive" : "default"}>
                                    {latestState.outbreak_detected ? "🚨 OUTBREAK" : "✅ Normal"}
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Analysis */}
                    {latestState.analysis && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl">🤖</span>
                                    AI Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{latestState.analysis}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Alerts */}
                    {latestState.alerts && latestState.alerts.length > 0 && (
                        <Alert className="border-red-500">
                            <AlertTriangle className="h-4 w-4"/>
                            <AlertDescription>
                                <div className="space-y-1">
                                    {latestState.alerts.map((alert, i) => (
                                        <div key={i}>{alert}</div>
                                    ))}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Interventions */}
                    {latestState.interventions && latestState.interventions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Active Interventions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {latestState.interventions.map((intervention: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                                            <span className="font-medium">{intervention.type}</span>
                                            <Badge>{intervention.count} individuals</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Simulation Chart */}
            {results && results.results.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Simulation Timeline</CardTitle>
                        <CardDescription>Track infections, R value, and network metrics over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SimulationChart data={results.results}/>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            {status?.has_results && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            refetchStatus();
                            refetchLatest();
                        }}
                    >
                        <RotateCcw className="mr-2 h-4 w-4"/>
                        Refresh
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => clearResults.mutate()}
                    >
                        Clear Results
                    </Button>
                </div>
            )}
        </div>
    );
}