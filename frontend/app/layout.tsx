import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {cookies} from "next/headers";
import "./globals.css";
import React from "react";
import {Providers} from './providers';
import {SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/AppSidebar";
import {Separator} from "@/components/ui/separator";
import {ModeToggle} from "@/components/ModeToggle";
import NavBreadCrumb from "@/components/NavBreadCrumb";

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: "PandemicNet AI - Contact Tracing & Network Analysis",
    description: "AI-powered pandemic contact tracing and network visualization system",
};

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
    return (
        <html lang="en" suppressHydrationWarning>
        <body
            className={`${inter.className} bg-background text-slate-100 antialiased`}
        >
        <Providers
            attribute={"class"}
            defaultTheme={"system"}
            enableSystem
            disableTransitionOnChange
        >
            <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar/>
                <div className={"min-h-screen flex flex-1 flex-col"}>
                    <main className={"container mx-auto px-4 py-6"}>
                        <header
                            className="flex flex-1 h-16 shrink-0 items-center gap-2 px-4 justify-between border-b">
                            <div className={"flex items-center gap-2"}>
                                <SidebarTrigger className="-ml-1 hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring"/>
                                <Separator
                                    orientation="vertical"
                                    className="mr-2 data-[orientation=vertical]:h-4"
                                />
                                <NavBreadCrumb homeElement={"Dashboard"} homeHref="/dashboard" basePath="/dashboard"/>
                            </div>
                            <ModeToggle/>
                        </header>
                        <div className={"container py-4 mx-auto"}>
                            {children}
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </Providers>
        </body>
        </html>
    );
}
