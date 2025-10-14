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
// Infection Trend Chart (Updated for Darker 'Healthy' area in the image)
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
                        {/* Red for Infected */}
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHealthy" x1="0" y1="0" x2="0" y2="1">
                        {/* Use --chart-5 for a darker shade to match the image's healthy area */}
                        <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3}/>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}/>

                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        color: 'hsl(var(--popover-foreground))',
                    }}
                />
                <Legend/>

                {/* Plot Healthy first so Infected is overlaid on top of it */}
                <Area
                    type="monotone"
                    dataKey="healthy"
                    stroke="hsl(var(--chart-5))" // Using chart-5 for the line color
                    fillOpacity={1}
                    fill="url(#colorHealthy)"
                    strokeWidth={2}
                    name="Healthy"
                />

                <Area
                    type="monotone"
                    dataKey="infected"
                    stroke="hsl(var(--destructive))"
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
// Network Distribution Chart (No changes needed, already uses --chart-1)
// ======================================================
interface NetworkDistributionChartProps {
    data?: Array<{ connections: string; count: number }>;
}

export function NetworkDistributionChart({data}: NetworkDistributionChartProps) {
    const chartData = data || generateConnectionDistribution();

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3}/>
                <XAxis
                    dataKey="connections"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{value: 'Connections', position: 'insideBottom', offset: -5}}
                />
                <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{value: 'Count', angle: -90, position: 'insideLeft'}}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                    }}
                />
                <Legend/>
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} name="Users"/>
            </BarChart>
        </ResponsiveContainer>
    );
}

// ======================================================
// Risk Distribution Chart (Updated for colors and labels to match the image)
// ======================================================
interface RiskDistributionChartProps {
    data?: Array<{ name: string; value: number }>;
}

export function RiskDistributionChart({data}: RiskDistributionChartProps) {
    // Data adjusted to match the percentages in the image: Healthy: 55%, Low: 18%, Medium: 13%, High: 8%, Infected: 6%
    const chartData =
        data || [
            {name: 'Healthy', value: 55}, // Darkest slice in the image (or blank space)
            {name: 'Low Risk', value: 18},
            {name: 'Medium Risk', value: 13},
            {name: 'High Risk', value: 8},
            {name: 'Infected', value: 6},
        ];

    // Colors assigned based on the visual distribution in the image
    const COLORS = [
        '#000000', // Black/dark color for Healthy (55%) to match the image's dark pie slice
        'hsl(var(--chart-4))', // Low Risk (18%)
        'hsl(var(--chart-3))', // Medium Risk (13%)
        'hsl(var(--chart-2))', // High Risk (8%)
        'hsl(var(--destructive))', // Infected (6%)
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // Remove custom label function to prevent clutter, as per the image
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                    }}
                    // Custom tooltip formatter to display value as percentage
                    formatter={(value, name, props) => {
                        const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
                        const percentage = ((value as number / total) * 100).toFixed(1);
                        return [`${percentage}%`, name];
                    }}
                />
                {/* Custom Legend to match the colors and labels from the image */}
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
// Contact Frequency Chart (No changes needed, uses --primary)
// ======================================================
interface ContactFrequencyChartProps {
    data?: Array<{ hour: string; contacts: number }>;
}

export function ContactFrequencyChart({data}: ContactFrequencyChartProps) {
    const chartData = data || generateHourlyContacts();

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3}/>
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="contacts"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4}}
                    activeDot={{r: 6}}
                    name="Contacts"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

// Export the components
// export { InfectionTrendChart, NetworkDistributionChart, RiskDistributionChart, ContactFrequencyChart };