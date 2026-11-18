'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Search,
    Users,
    AlertTriangle,
    MapPin,
    Activity,
    Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

export default function TracePage() {
    const [searchId, setSearchId] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [days, setDays] = useState(14);

    // Fetch trace results
    const { data: traceResult, isLoading, error } = useQuery({
        queryKey: ['trace', activeId, days],
        queryFn: () => api.traceContacts(activeId!, days),
        enabled: !!activeId,
    });

    const handleSearch = () => {
        if (searchId.trim()) {
            setActiveId(searchId.trim());
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Contact Tracing</h1>
                <p className="text-muted-foreground mt-1">
                    Trace direct and predicted contacts using AI-powered analysis
                </p>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Enter individual ID to trace..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="w-32">
                            <Input
                                type="number"
                                placeholder="Days"
                                value={days}
                                onChange={(e) => setDays(parseInt(e.target.value) || 14)}
                                min={1}
                                max={90}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={!searchId.trim()}
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Trace
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Search for an individual to view their contact network and AI-predicted exposures
                    </p>
                </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Tracing contacts...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <Alert className="bg-destructive/10 border-destructive/30">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                        Failed to trace contacts. Individual may not exist in the database.
                    </AlertDescription>
                </Alert>
            )}

            {/* Results */}
            {traceResult && !isLoading && (
                <div className="space-y-6">
                    {/* Overview Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Direct Contacts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">
                                    {traceResult.direct_contacts.length}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Predicted Contacts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">
                                    {traceResult.predicted_contacts.length}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Max Separation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">
                                    {Object.keys(traceResult.degrees_of_separation).length}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Network Size</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-foreground">
                                    {traceResult.network_stats.total_individuals}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Insights */}
                    {traceResult.ai_insights && (
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    AI Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground/90 whitespace-pre-line">
                                    {traceResult.ai_insights}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Direct Contacts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Direct Contacts ({traceResult.direct_contacts.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {traceResult.direct_contacts.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {traceResult.direct_contacts.map((contact, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-card rounded-lg border border-border"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-foreground">
                                                            {contact.contact_id}
                                                        </p>
                                                        {contact.venue_id && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                <MapPin className="w-3 h-3 inline mr-1" />
                                                                {contact.venue_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge
                                                        className={
                                                            contact.contact_infected
                                                                ? 'bg-destructive/15 text-destructive border-destructive/30'
                                                                : 'bg-chart-4/20 text-chart-4 border-chart-4/30'
                                                        }
                                                    >
                                                        {contact.contact_infected ? 'INFECTED' : 'HEALTHY'}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-muted-foreground">Date:</span>
                                                        <p className="text-foreground/90">
                                                            {format(new Date(contact.contact_date), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                    {contact.duration_minutes && (
                                                        <div>
                                                            <span className="text-muted-foreground">Duration:</span>
                                                            <p className="text-foreground/90">
                                                                {contact.duration_minutes} min
                                                            </p>
                                                        </div>
                                                    )}
                                                    {contact.proximity && (
                                                        <div>
                                                            <span className="text-muted-foreground">Proximity:</span>
                                                            <p className="text-foreground/90 capitalize">
                                                                {contact.proximity}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No direct contacts found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Predicted Contacts (ML) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    AI-Predicted Contacts ({traceResult.predicted_contacts.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {traceResult.predicted_contacts.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {traceResult.predicted_contacts.map((predicted, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-card rounded-lg border border-border"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-foreground">
                                                            {predicted.unique_id}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        className={
                                                            predicted.risk_level === 'HIGH'
                                                                ? 'bg-destructive/15 text-destructive border-destructive/30'
                                                                : predicted.risk_level === 'MEDIUM'
                                                                    ? 'bg-chart-2/20 text-chart-2 border-chart-2/30'
                                                                    : 'bg-chart-4/20 text-chart-4 border-chart-4/30'
                                                        }
                                                    >
                                                        {predicted.risk_level}
                                                    </Badge>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-muted-foreground">Risk Score</span>
                                                        <span className="text-foreground font-semibold">
                                                            {(predicted.risk_score * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${
                                                                predicted.risk_level === 'HIGH' ? 'bg-destructive' :
                                                                    predicted.risk_level === 'MEDIUM' ? 'bg-chart-2' :
                                                                        'bg-chart-4'
                                                            }`}
                                                            style={{ width: `${predicted.risk_score * 100}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {predicted.explanation && (
                                                    <p className="text-xs text-muted-foreground italic">
                                                        {predicted.explanation}
                                                    </p>
                                                )}

                                                {predicted.top_factors && predicted.top_factors.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-border">
                                                        <p className="text-xs text-muted-foreground mb-1">Top Factors:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {predicted.top_factors.slice(0, 3).map((factor, i) => (
                                                                <Badge key={i} variant="outline" className="text-xs">
                                                                    {factor.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No predicted contacts</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Degrees of Separation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Degrees of Separation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(traceResult.degrees_of_separation)
                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                    .map(([degree, individuals]) => (
                                        <div key={degree}>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-foreground">
                                                    Degree {degree}
                                                </h4>
                                                <Badge variant="outline">
                                                    {individuals.length} {individuals.length === 1 ? 'person' : 'people'}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {individuals.slice(0, 10).map((id) => (
                                                    <Badge
                                                        key={id}
                                                        variant="secondary"
                                                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                                        onClick={() => {
                                                            setSearchId(id);
                                                            setActiveId(id);
                                                        }}
                                                    >
                                                        {id}
                                                    </Badge>
                                                ))}
                                                {individuals.length > 10 && (
                                                    <Badge variant="outline">
                                                        +{individuals.length - 10} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {!activeId && !isLoading && (
                <Card>
                    <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Search className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                            <p className="text-foreground text-lg font-medium">
                                Search for an individual to begin contact tracing
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Enter an ID above to trace their contact network
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
