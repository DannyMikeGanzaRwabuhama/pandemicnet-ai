import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format risk score as percentage
 */
export function formatRiskScore(score: number): string {
    return `${(score * 100).toFixed(0)}%`;
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score > 0.7) return 'HIGH';
    if (score > 0.4) return 'MEDIUM';
    return 'LOW';
}

/**
 * Get color class for risk level
 */
export function getRiskColor(level: string): string {
    switch (level) {
        case 'HIGH':
            return 'text-red-400 bg-red-500/20 border-red-500/50';
        case 'MEDIUM':
            return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
        case 'LOW':
            return 'text-green-400 bg-green-500/20 border-green-500/50';
        default:
            return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
    }
}

/**
 * Get status color for infected/healthy
 */
export function getStatusColor(infected: boolean): string {
    return infected
        ? 'text-red-400 bg-red-500/20 border-red-500/50'
        : 'text-green-400 bg-green-500/20 border-green-500/50';
}

/**
 * Format date range for display
 */
export function formatDateRange(days: number): string {
    if (days === 1) return 'Last 24 hours';
    if (days === 7) return 'Last week';
    if (days === 14) return 'Last 2 weeks';
    if (days === 30) return 'Last month';
    return `Last ${days} days`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

/**
 * Calculate infection rate
 */
export function calculateInfectionRate(infected: number, total: number): number {
    if (total === 0) return 0;
    return (infected / total) * 100;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Generate random color for visualization
 */
export function generateColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Format large numbers
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

/**
 * Parse query parameters
 */
export function getQueryParam(key: string): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

/**
 * Download JSON data
 */
export function downloadJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Download CSV data
 */
export function downloadCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}