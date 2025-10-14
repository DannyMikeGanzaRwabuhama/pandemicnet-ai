'use client';

import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Individual, NetworkData, NetworkStats} from "@/lib/types";
import {api} from '@/lib/api';

export function useNetwork(limit = 100) {
    return useQuery<NetworkData>({
        queryKey: ['network', limit],
        queryFn: () => api.getNetwork(limit),
        refetchInterval: 30000,
    });
}

// ✅ Extended: return both statistics + ai_insights
export function useNetworkStats() {
    return useQuery<{ statistics: NetworkStats; ai_insights?: string }>({
        queryKey: ['network-stats'],
        queryFn: () => api.getNetworkStats(),
        refetchInterval: 30000,
    });
}

export function useIndividuals(limit = 100, infectedOnly = false) {
    return useQuery<Individual[]>({
        queryKey: ['individuals', limit, infectedOnly],
        queryFn: () => api.getIndividuals(limit, infectedOnly),
        refetchInterval: 30000,
    });
}

export function useIndividual(id: string | null) {
    return useQuery<Individual>({
        queryKey: ['individual', id],
        queryFn: () => api.getIndividual(id),
        enabled: !!id,
    });
}

export function useSuperspreaders(threshold = 10) {
    return useQuery({
        queryKey: ['superspreaders', threshold],
        queryFn: () => api.getSuperspreaders(threshold),
        refetchInterval: 60000,
    });
}

export function useReportInfection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.reportInfection.bind(api),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['network']});
            queryClient.invalidateQueries({queryKey: ['network-stats']});
            queryClient.invalidateQueries({queryKey: ['individuals']});
        },
    });
}
