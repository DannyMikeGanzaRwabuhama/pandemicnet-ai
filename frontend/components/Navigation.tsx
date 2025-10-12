'use client';

import React from 'react'
import {Activity, BarChart3, Map, Network, Search} from "lucide-react";
import {usePathname} from "next/navigation";
import Link from "next/link";

const routes = [
    {href: '/', label: 'Dashboard', icon: Activity},
    {href: '/network', label: 'Network', icon: Network},
    {href: '/map', label: 'Map', icon: Map},
    {href: '/trace', label: 'Trace', icon: Search},
    {href: '/analytics', label: 'Analytics', icon: BarChart3},
]

const Navigation = () => {
    const pathname = usePathname();

    return (
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-2">
                        <div
                            className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                            <Activity className="w-6 h-6 text-white"/>
                        </div>
                        <span
                            className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              PandemicNet AI
            </span>
                    </div>

                    <div className="flex items-center space-x-1">
                        {routes.map((route) => {
                            const Icon = route.icon;
                            const isActive = pathname === route.href;

                            return (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive
                                        ? 'bg-slate-800 text-blue-400'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                                    }
                  `}
                                >
                                    <Icon className="w-4 h-4"/>
                                    <span className="text-sm font-medium">{route.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    )
}
export default Navigation
