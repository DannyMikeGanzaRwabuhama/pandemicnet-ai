'use client';

import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {api} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {
    Search,
    Users,
    AlertTriangle,
    Calendar,
    MapPin,
    Activity,
    Sparkles
} from 'lucide-react';
import {format} from 'date-fns';
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";

export default function TracePage() {
    const [searchId, setSearchId] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [days, setDays] = useState(14);

    // Fetch trace results
    const {data: traceResult, isLoading, error} = useQuery({
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
        <div className={"space-y-6"}>
            {/*    Header*/}
            <div>
                <h1 className="text-3xl font-bold text-slate-100">Contact Tracing</h1>
                <p className="text-slate-400 mt-1">
                    Trace direct and predicted contacts using AI-powered analysis
                </p>
            </div>

            {/*    Search Bar*/}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Enter individual ID to trace..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="bg-slate-800 border-slate-700 text-slate-100"
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
                                className="bg-slate-800 border-slate-700 text-slate-100"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!searchId.trim()}
                        >
                            <Search className="w-4 h-4 mr-2"/>
                            Trace
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Search for an individual to view their contact network and AI-predicted exposures
                    </p>
                </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"/>
                        <p className="text-slate-400">Tracing contacts...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <Alert className="bg-red-500/10 border-red-500/50">
                    <AlertTriangle className="w-4 h-4 text-red-400"/>
                    <AlertDescription className="text-red-400">
                        Failed to trace contacts. Individual may not exist in the database.
                    </AlertDescription>
                </Alert>
            )}

            {/*    Results*/}
            {traceResult && !isLoading && (
                <div className={"space-y-6"}>
                    {/*    Overview Cards*/}
                    <div className={"grid gap-4 md:grid-cols-4"}>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-slate-400">Direct Contacts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-slate-100">
                                    {traceResult.direct_contacts.length}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-slate-400">Predicted Contacts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-slate-100">
                                    {traceResult.predicted_contacts.length}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-slate-400">Max Separation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-slate-100">
                                    {Object.keys(traceResult.degrees_of_separation).length}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-slate-400">Network Size</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-slate-100">
                                    {traceResult.network_stats.total_individuals}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/*    AI insights*/}
                    {traceResult.ai_insights && (
                        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
                            <CardHeader>
                                <CardTitle className="text-slate-100 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400"/>
                                    AI Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-300 whitespace-pre-line">
                                    {traceResult.ai_insights}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Direct Contacts */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-100 flex items-center gap-2">
                                    <Users className="w-5 h-5"/>
                                    Direct Contacts ({traceResult.direct_contacts.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {traceResult.direct_contacts.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {traceResult.direct_contacts.map((contact, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-100">
                                                            {contact.contact_id}
                                                        </p>
                                                        {contact.venue_id && (
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                <MapPin className="w-3 h-3 inline mr-1"/>
                                                                {contact.venue_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge
                                                        className={
                                                            contact.contact_infected
                                                                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                                                : 'bg-green-500/20 text-green-400 border-green-500/50'
                                                        }
                                                    >
                                                        {contact.contact_infected ? 'INFECTED' : 'HEALTHY'}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-slate-500">Date:</span>
                                                        <p className="text-slate-300">
                                                            {format(new Date(contact.contact_date), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                    {contact.duration_minutes && (
                                                        <div>
                                                            <span className="text-slate-500">Duration:</span>
                                                            <p className="text-slate-300">
                                                                {contact.duration_minutes} min
                                                            </p>
                                                        </div>
                                                    )}
                                                    {contact.proximity && (
                                                        <div>
                                                            <span className="text-slate-500">Proximity:</span>
                                                            <p className="text-slate-300 capitalize">
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
                                        <Users className="w-12 h-12 text-slate-700 mx-auto mb-2"/>
                                        <p className="text-sm text-slate-400">No direct contacts found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Predicted Contacts (ML) */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-100 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400"/>
                                    AI-Predicted Contacts ({traceResult.predicted_contacts.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {traceResult.predicted_contacts.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {traceResult.predicted_contacts.map((predicted, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-100">
                                                            {predicted.unique_id}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        className={
                                                            predicted.risk_level === 'HIGH'
                                                                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                                                : predicted.risk_level === 'MEDIUM'
                                                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                                                    : 'bg-green-500/20 text-green-400 border-green-500/50'
                                                        }
                                                    >
                                                        {predicted.risk_level}
                                                    </Badge>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-slate-400">Risk Score</span>
                                                        <span className="text-slate-100 font-semibold">
                              {(predicted.risk_score * 100).toFixed(0)}%
                            </span>
                                                    </div>
                                                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${
                                                                predicted.risk_level === 'HIGH' ? 'bg-red-500' :
                                                                    predicted.risk_level === 'MEDIUM' ? 'bg-yellow-500' :
                                                                        'bg-green-500'
                                                            }`}
                                                            style={{width: `${predicted.risk_score * 100}%`}}
                                                        />
                                                    </div>
                                                </div>

                                                {predicted.explanation && (
                                                    <p className="text-xs text-slate-400 italic">
                                                        {predicted.explanation}
                                                    </p>
                                                )}

                                                {predicted.top_factors && predicted.top_factors.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-slate-700">
                                                        <p className="text-xs text-slate-500 mb-1">Top Factors:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {predicted.top_factors.slice(0, 3).map((factor, i) => (
                                                                <Badge key={i} variant="outline"
                                                                       className="text-xs border-slate-600">
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
                                        <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-2"/>
                                        <p className="text-sm text-slate-400">No predicted contacts</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/*    Degrees of Separation*/}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-slate-100 flex items-center gap-2">
                                <Activity className="w-5 h-5"/>
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
                                                <h4 className="text-sm font-semibold text-slate-100">
                                                    Degree {degree}
                                                </h4>
                                                <Badge variant="outline" className="border-slate-600">
                                                    {individuals.length} {individuals.length === 1 ? 'person' : 'people'}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {individuals.slice(0, 10).map((id) => (
                                                    <Badge
                                                        key={id}
                                                        className="bg-slate-800 text-slate-300 border-slate-700 cursor-pointer hover:bg-slate-700"
                                                        onClick={() => {
                                                            setSearchId(id);
                                                            setActiveId(id);
                                                        }}
                                                    >
                                                        {id}
                                                    </Badge>
                                                ))}
                                                {individuals.length > 10 && (
                                                    <Badge variant="outline" className="border-slate-600">
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
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Search className="w-16 h-16 text-slate-700 mx-auto mb-4"/>
                            <p className="text-slate-400 text-lg font-medium">
                                Search for an individual to begin contact tracing
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                                Enter an ID above to trace their contact network
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}