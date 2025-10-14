import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SimulationChartProps {
    data: Array<{
        day: number;
        date: string;
        new_infections: number;
        total_infected: number;
        r_value: number;
        outbreak_detected: boolean;
        contacts_created: number;
    }>;
}

export default function SimulationChart({ data }: SimulationChartProps) {
    return (
        <div className="space-y-4">
            {/* Infections Chart */}
            <div>
                <h3 className="text-sm font-medium mb-2">Infections Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="day"
                            label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-background border p-2 rounded shadow-lg">
                                            <p className="text-sm font-medium">Day {payload[0].payload.day}</p>
                                            <p className="text-sm text-red-600">
                                                New: {payload[0].payload.new_infections}
                                            </p>
                                            <p className="text-sm text-orange-600">
                                                Total: {payload[0].payload.total_infected}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="new_infections"
                            stroke="#ef4444"
                            name="New Infections"
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="total_infected"
                            stroke="#f97316"
                            name="Total Infected"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* R Value Chart */}
            <div>
                <h3 className="text-sm font-medium mb-2">R Value (Reproduction Number)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="day"
                            label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const rValue = payload[0].payload.r_value;
                                    return (
                                        <div className="bg-background border p-2 rounded shadow-lg">
                                            <p className="text-sm font-medium">Day {payload[0].payload.day}</p>
                                            <p className={`text-sm font-bold ${rValue > 1 ? 'text-red-600' : 'text-green-600'}`}>
                                                R = {rValue.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {rValue > 1 ? '📈 Epidemic growing' : '📉 Under control'}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="r_value"
                            stroke="#3b82f6"
                            name="R Value"
                            strokeWidth={2}
                        />
                        {/* Reference line at R=1 */}
                        <Line
                            type="monotone"
                            dataKey={() => 1}
                            stroke="#94a3b8"
                            strokeDasharray="5 5"
                            name="R = 1 (threshold)"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Network Activity */}
            <div>
                <h3 className="text-sm font-medium mb-2">Daily Contact Network</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="day"
                            label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="contacts_created"
                            stroke="#22c55e"
                            name="New Contacts"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}