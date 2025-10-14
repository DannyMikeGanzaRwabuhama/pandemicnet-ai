"use client";

import {Activity, BarChart3, ChevronDown, Home, Network, Search, Map, Bot} from "lucide-react"
import Link from "next/link"
import {usePathname} from "next/navigation"

import {
    Sidebar,
    SidebarContent, SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel, SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem, SidebarSeparator,
} from "@/components/ui/sidebar"
import React from "react";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {NavUser} from "@/components/NavUser";

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
}

// Menu items.
const items = [
    {
        title: "Home",
        url: "/",
        icon: Home,
    },
    {
        title: "Network",
        url: "/network",
        icon: Network,
    },
    {
        title: "Map",
        url: "/map",
        icon: Map,
    },
    {
        title: "Trace",
        url: "/trace",
        icon: Search
    },
    {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3
    },
    {
        title: "Agents",
        url: "/agents",
        icon: Bot
    }
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar
            variant={"floating"}
            collapsible={"icon"}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <Link href="/">
                                <Activity className="!size-5"/>
                                <span className="text-base font-semibold">PandemicNet</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarSeparator/>
            <SidebarContent>
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger>
                                Application
                                <ChevronDown
                                    className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"/>
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {items.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={
                                                    item.url === "/"
                                                        ? pathname === item.url
                                                        : pathname === item.url || pathname.startsWith(item.url + "/")
                                                }
                                            >
                                                <Link href={item.url}>
                                                    <item.icon/>
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            </SidebarContent>
            <SidebarFooter>
                <NavUser
                    user={data.user}
                />
            </SidebarFooter>
        </Sidebar>
    )
}