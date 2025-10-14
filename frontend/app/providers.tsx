'use client';

import React, {useState} from "react";

import {QueryClient} from "@tanstack/query-core";
import {ThemeProvider as NextThemesProvider} from "next-themes"
import {QueryClientProvider} from "@tanstack/react-query";

export function Providers({children, ...props}: React.ComponentProps<typeof NextThemesProvider>) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    }
                }
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider {...props}>
                {children}
            </NextThemesProvider>
        </QueryClientProvider>
    )
}