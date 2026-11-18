'use client';

import React from 'react';
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

// ======================================================
// Helper functions for generating sample data
// ======================================================

function generateSampleTrendData() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
        date: day,
        infected: 5 + i * 2,
        healthy: 50 - i * 2,
        newCases: Math.floor(Math.random() * 5) + 1,
    }));
}

function generateConnectionDistribution() {
    return [
        {connections: '0-5', count: 45},
        {connections: '6-10', count: 32},
        {connections: '11-15', count: 18},
        {connections: '16-20', count: 8},
        {connections: '20+', count: 4},
    ];
}

function generateHourlyContacts() {
    const hours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];
    return hours.map((hour) => ({
        hour,
        contacts: Math.floor(Math.random() * 40) + 10,
    }));
}

// ======================================================
// Infection Trend Chart
// ======================================================
interface InfectionTrendChartProps {
    data?: Array<{ date: string; infected: number; healthy: number; newCases: number }>;
}

export function InfectionTrendChart({data}: InfectionTrendChartProps) {
    const chartData = data || generateSampleTrendData();

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorInfected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHealthy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3}/>
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12}/>
                <YAxis stroke="var(--muted-foreground)" fontSize={12}/>

                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        color: 'var(--popover-foreground)',
                    }}
                />
                <Legend/>

                <Area
                    type="monotone"
                    dataKey="healthy"
                    stroke="var(--chart-4)"
                    fillOpacity={1}
                    fill="url(#colorHealthy)"
                    strokeWidth={2}
                    name="Healthy"
                />

                <Area
                    type="monotone"
                    dataKey="infected"
                    stroke="var(--destructive)"
                    fillOpacity={1}
                    fill="url(#colorInfected)"
                    strokeWidth={2}
                    name="Infected"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ======================================================
// Network Distribution Chart
// ======================================================
interface NetworkDistributionChartProps {
    data?: Array<{ connections: string; count: number }>;
}

export function NetworkDistributionChart({data}: NetworkDistributionChartProps) {
    const chartData = data || generateConnectionDistribution();

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3}/>
                <XAxis
                    dataKey="connections"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    label={{value: 'Connections', position: 'insideBottom', offset: -5}}
                />
                <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    label={{value: 'Count', angle: -90, position: 'insideLeft'}}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        color: 'var(--popover-foreground)',
                    }}
                />
                <Legend/>
                <Bar dataKey="count" fill="var(--chart-1)" radius={[8, 8, 0, 0]} name="Users"/>
            </BarChart>
        </ResponsiveContainer>
    );
}

// ======================================================
// Risk Distribution Chart
// ======================================================
interface RiskDistributionChartProps {
    data?: Array<{ name: string; value: number }>;
}

export function RiskDistributionChart({data}: RiskDistributionChartProps) {
    const chartData =
        data || [
            {name: 'Healthy', value: 55},
            {name: 'Low Risk', value: 18},
            {name: 'Medium Risk', value: 13},
            {name: 'High Risk', value: 8},
            {name: 'Infected', value: 6},
        ];

    const COLORS = [
        'var(--chart-4)',
        'var(--chart-3)',
        'var(--chart-2)',
        'var(--chart-1)',
        'var(--destructive)',
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="var(--primary)"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        color: 'var(--popover-foreground)',
                    }}
                    formatter={(value, name) => {
                        const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
                        const percentage = ((value as number / total) * 100).toFixed(1);
                        return [`${percentage}%`, name];
                    }}
                />
                <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{paddingTop: '20px'}}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

// ======================================================
// Contact Frequency Chart
// ======================================================
interface ContactFrequencyChartProps {
    data?: Array<{ hour: string; contacts: number }>;
}

export function ContactFrequencyChart({data}: ContactFrequencyChartProps) {
    const chartData = data || generateHourlyContacts();

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3}/>
                <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={11}/>
                <YAxis stroke="var(--muted-foreground)" fontSize={11}/>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        color: 'var(--popover-foreground)',
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="contacts"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{fill: 'var(--primary)', strokeWidth: 2, r: 4}}
                    activeDot={{r: 6}}
                    name="Contacts"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
