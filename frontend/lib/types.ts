// =======================
// ✅ Core Network Entities
// =======================
export interface Individual {
    unique_id: string;
    phone_number?: string | null;
    infected: boolean;
    infection_date?: string | null;
    location?: string | null;
    severity?: 'mild' | 'moderate' | 'severe';
    symptoms?: string[];
    risk_score?: number | null;
    contact_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface Contact {
    individual_id: string;
    contact_id: string;
    contact_date: string;
    venue_id?: string | null;
    duration_minutes?: number | null;
    proximity?: 'close' | 'medium' | 'far' | null;
    contact_infected: boolean;
}

export interface ContactCreate {
    individual_id: string;
    contact_id: string;
    contact_date: string;
    venue_id?: string | null;
    duration_minutes?: number | null;
    proximity?: 'close' | 'medium' | 'far' | null;
}

// =======================
// ✅ Network Graph Types
// =======================
export interface NetworkNode {
    id: string;
    infected: boolean;
    location?: string;
    connections: number;
    risk_score?: number;
    infection_date?: string;
}

export interface NetworkEdge {
    source: string;
    target: string;
    date: string;
    venue?: string;
    duration?: number;
    proximity?: string;
}

export interface NetworkData {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
}

// =======================
// ✅ Analytics Types
// =======================
export interface NetworkStats {
    total_individuals: number;
    total_contacts: number;
    infected_count: number;
    average_contacts: number;
    density?: number;
    infection_rate?: number;
    max_degree_separation?: number;
    clusters?: number;
}

export interface CentralityNode {
    unique_id: string;
    degree: number;
    betweenness: number;
    closeness: number;
    eigenvector: number;
}

export interface Superspreader {
    unique_id: string;
    contact_count: number;
    infected_contacts?: number;
    infection_date?: string;
    location?: string;
    centrality_score?: number;
}

export interface SuperSpreaderResponse {
    alert: string;
    count: number;
    superspreaders: Superspreader[];
}

export interface Community {
    community_id: number;
    members: string[];
    size: number;
    infected_count: number;
    infection_rate: number;
}

// =======================
// ✅ Tracing & Risk
// =======================
export interface PredictedContact {
    unique_id: string;
    risk_score: number;
    risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
    factors: {
        contact_count?: number;
        days_since_contact?: number;
        mutual_contacts?: number;
        proximity_score?: number;
        duration_score?: number;
        recency_score?: number;
    };
    explanation?: string;
    top_factors?: Array<{ name: string; value: number }>;
}

export interface ContactTraceResult {
    traced_individual: string;
    direct_contacts: Contact[];
    predicted_contacts: PredictedContact[];
    degrees_of_separation: Record<number, string[]>;
    network_stats: NetworkStats;
    ai_insights?: string;
}

export interface RiskAssessment {
    unique_id: string;
    risk_score: number;
    risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
    direct_exposure_count: number;
    indirect_exposure_count: number;
    last_contact_date?: string;
    recommendation: string;
    factors: Record<string, any>;
}

// =======================
// ✅ Infection Reporting
// =======================
export interface InfectionReport {
    unique_id: string;
    infection_date?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    symptoms?: string[];
}

// =======================
// ✅ Filtering & Visualization
// =======================
export interface DateRange {
    start: Date;
    end: Date;
}

export interface FilterOptions {
    dateRange?: DateRange;
    infectedOnly?: boolean;
    riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL';
    location?: string;
    minConnections?: number;
}

// =======================
// ✅ D3 / Visualization Types
// =======================
export interface D3Node extends NetworkNode {
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    vx?: number;
    vy?: number;
}

export interface D3Link extends NetworkEdge {
    source: string | D3Node;
    target: string | D3Node;
    index?: number;
}

// =======================
// ✅ Map Types
// =======================
export interface MapMarker {
    id: string;
    position: [number, number]; // [lat, lng]
    infected: boolean;
    connections: number;
    tooltip: string;
}

export interface MapConnection {
    from: [number, number];
    to: [number, number];
    infected: boolean;
}

export interface AgentConfig {
    movement_probability: number;
    avg_daily_contacts: number;
    base_infection_rate: number;
    infection_factors: Record<string, number>;
    locations: string[];
    enable_auto_interventions: boolean;
    outbreak_threshold: number;
    superspreader_threshold: number;
}

export interface SimulationStatus {
    running: boolean;
    current_day: number;
    total_days: number;
    progress: number;
    start_time: string | null;
    error: string | null;
    has_results: boolean;
}

export interface SimulationDayResult {
    day: number;
    date: string;
    new_infections: number;
    total_infected: number;
    r_value: number;
    outbreak_detected: boolean;
    contacts_created: number;
    interventions?: any[];
    alerts?: string[];
    analysis?: string;
    execution_time?: number;
}

export interface SimulationLatestState {
    day: number;
    date: string;
    total_individuals: number;
    new_infections: number;
    total_infected: number;
    active_infections: number;
    r_value: number;
    outbreak_detected: boolean;
    contacts_created_today: number;
    total_contacts: number;
    network_density: number;
    superspreaders: string[];
    quarantined: number;
    tested_today: number;
    interventions: any[];
    alerts: string[];
    analysis: string;
    recommendations: string[];
    execution_time: number;
}