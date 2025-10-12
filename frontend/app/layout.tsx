import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import React from "react";
import {Providers} from './providers';
import Navigation from '@/components/Navigation';

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: "PandemicNet AI - Contact Tracing & Network Analysis",
    description: "AI-powered pandemic contact tracing and network visualization system",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}
        >
        <Providers>
            <div className={"min-h-screen flex flex-col"}>
                <Navigation/>
                <main className={"flex-1 container mx-auto px-4 py-6"}>
                    {children}
                </main>
                <footer className={"border-t border-slate-800 py-4"}>
                    <div className={"container mx-auto px-4 text-center text-sm text-slate-400"}>
                        PandemicNet AI • Phase 2 • Built with Next.js + Neo4j + D3.js
                    </div>
                </footer>
            </div>
        </Providers>
        </body>
        </html>
    );
}
