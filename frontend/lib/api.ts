'use client';

import axios, {AxiosInstance} from 'axios';
import {
    AgentConfig,
    CentralityNode,
    Community,
    Contact,
    ContactCreate,
    ContactTraceResult,
    Individual,
    InfectionReport,
    NetworkData,
    NetworkStats,
    RiskAssessment, SimulationDayResult, SimulationLatestState, SimulationStatus,
    Superspreader,
} from '@/lib/types';

class PandemicNetAPI {
    private client: AxiosInstance;

    constructor(baseURL?: string) {
        this.client = axios.create({
            baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
            timeout: 30000,
            headers: {'Content-Type': 'application/json'},
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('API Error:', error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }

    async getIndividuals(limit = 100, infectedOnly = false): Promise<Individual[]> {
        const {data} = await this.client.get('/individuals/', {params: {limit, infectedOnly}});
        return data;
    }

    async getIndividual(id: string | null): Promise<Individual> {
        const {data} = await this.client.get(`/individuals/${id}`);
        return data;
    }

    async createIndividual(individual: Partial<Individual>): Promise<Individual> {
        const {data} = await this.client.post('/individuals/', individual);
        return data;
    }

    async updateIndividual(id: string, updates: Partial<Individual>): Promise<Individual> {
        const {data} = await this.client.put(`/individuals/${id}`, updates);
        return data;
    }

    async deleteIndividual(id: string): Promise<void> {
        await this.client.delete(`/individuals/${id}`);
    }

    async getDirectContacts(id: string, days = 14): Promise<Contact[]> {
        const {data} = await this.client.get(`/contacts/${id}/direct`, {params: {days}});
        return data;
    }

    async traceContacts(id: string, days = 14): Promise<ContactTraceResult> {
        const {data} = await this.client.get(`/contacts/${id}/trace`, {params: {days}});
        return data;
    }

    async createContact(contact: ContactCreate): Promise<Contact> {
        const {data} = await this.client.post('/contacts/', contact);
        return data;
    }

    async deleteContact(id1: string, id2: string): Promise<void> {
        await this.client.delete(`/contacts/${id1}/${id2}`);
    }

    async getContactPath(id1: string, id2: string): Promise<string[]> {
        const {data} = await this.client.get(`/contacts/${id1}/path/${id2}`);
        return data.path || [];
    }

    async getRecentContacts(days = 7, limit = 50): Promise<Contact[]> {
        const {data} = await this.client.get('/contacts/bulk/recent', {params: {days, limit}});
        return data;
    }

    async getNetwork(limit = 100): Promise<NetworkData> {
        const {data} = await this.client.get('/graph/network', {params: {limit}});
        return data;
    }

    async getNetworkStats(): Promise<NetworkStats> {
        const {data} = await this.client.get('/graph/statistics');
        return data; // Return flat NetworkStats object
    }

    async getCentrality(limit = 10): Promise<CentralityNode[]> {
        const {data} = await this.client.get('/graph/centrality', {params: {limit}});
        return data;
    }

    async getCommunities(): Promise<Community[]> {
        const {data} = await this.client.get('/graph/communities');
        return data;
    }

    async getDegreesOfSeparation(id: string, maxDepth = 6): Promise<Record<number, string[]>> {
        const {data} = await this.client.get(`/graph/degrees/${id}`, {params: {max_depth: maxDepth}});
        return data.degrees || {};
    }

    async visualizeNetwork(id: string, depth = 2): Promise<NetworkData> {
        const {data} = await this.client.get(`/graph/visualize/${id}`, {params: {depth}});
        return data;
    }

    async clearGraph(confirm = false): Promise<void> {
        if (!confirm) throw new Error('Must confirm graph deletion');
        await this.client.post('/graph/clear', null, {params: {confirm: true}});
    }

    async exportGraph(format: 'json' | 'csv' = 'json'): Promise<any> {
        const {data} = await this.client.get('/graph/export', {params: {format}});
        return data;
    }

    async reportInfection(report: InfectionReport): Promise<Individual> {
        const {data} = await this.client.post('/infections/report', report);
        return data;
    }

    async getRiskAssessment(id: string): Promise<RiskAssessment> {
        const {data} = await this.client.get(`/infections/risk/${id}`);
        return data;
    }

    async getSuperspreaders(threshold = 10): Promise<Superspreader[]> {
        const {data} = await this.client.get('/infections/superspreaders', {params: {threshold}});
        return data.superspreaders; // Return just the superspreaders array
    }

    async getExposureChains(sourceId: string, maxDepth = 5): Promise<any> {
        const {data} = await this.client.get(`/infections/exposure-chains/${sourceId}`, {params: {max_depth: maxDepth}});
        return data;
    }

    async getInfectionStatistics(): Promise<any> {
        const {data} = await this.client.get('/infections/statistics');
        return data;
    }

    async clearInfection(id: string): Promise<void> {
        await this.client.delete(`/infections/clear/${id}`);
    }

    async healthCheck(): Promise<{ status: string }> {
        const {data} = await this.client.get('/health');
        return data;
    }

    async seedData(count = 50): Promise<any> {
        const {data} = await this.client.post('/seed', null, {params: {count}});
        return data;
    }

    // ====================== AGENTS ======================

    async checkAgentsAvailable(): Promise<{ available: boolean; message: string }> {
        const {data} = await this.client.get('/agents/available');
        return data;
    }

    async getAgentConfig(): Promise<AgentConfig> {
        const {data} = await this.client.get('/agents/config');
        return data;
    }

    async updateAgentConfig(updates: Partial<AgentConfig>): Promise<{ message: string; config: AgentConfig }> {
        const {data} = await this.client.post('/agents/config', updates);
        return data;
    }

    async startSimulation(days: number, startDate?: string, initialPopulation?: number): Promise<any> {
        const {data} = await this.client.post('/agents/simulation/start', {
            days,
            start_date: startDate,
            initial_population: initialPopulation
        });
        return data;
    }

    async runSingleDay(simulationDay: number, currentDate: string): Promise<SimulationDayResult> {
        const {data} = await this.client.post('/agents/simulation/day', {
            simulation_day: simulationDay,
            current_date: currentDate
        });
        return data;
    }

    async getSimulationStatus(): Promise<SimulationStatus> {
        const {data} = await this.client.get('/agents/simulation/status');
        return data;
    }

    async getSimulationResults(limit?: number, fromDay?: number, toDay?: number): Promise<{
        total_days: number;
        results: SimulationDayResult[]
    }> {
        const {data} = await this.client.get('/agents/simulation/results', {
            params: {limit, from_day: fromDay, to_day: toDay}
        });
        return data;
    }

    async getLatestSimulationState(): Promise<SimulationLatestState> {
        const {data} = await this.client.get('/agents/simulation/latest');
        return data;
    }

    async stopSimulation(): Promise<{ message: string }> {
        const {data} = await this.client.post('/agents/simulation/stop');
        return data;
    }

    async clearSimulationResults(): Promise<{ message: string }> {
        const {data} = await this.client.delete('/agents/simulation/clear');
        return data;
    }

    async getWorkflowDiagram(): Promise<{ diagram: string }> {
        const {data} = await this.client.get('/agents/workflow');
        return data;
    }
}

export const api = new PandemicNetAPI();
export default PandemicNetAPI;