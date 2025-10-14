'use client';

import {usePathname} from 'next/navigation';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import React, {Fragment, type ReactNode} from 'react';

type NavBreadcrumbProps = {
    homeElement: ReactNode;
    homeHref?: string;
    separator?: React.ReactNode;
    capitalizeLinks?: boolean;
    basePath?: string;
    maxItems?: number;
};

const NavBreadCrumb = ({
                           homeElement,
                           homeHref = '/',
                           separator,
                           capitalizeLinks = true,
                           basePath = '/',
                           maxItems = 4,
                       }: NavBreadcrumbProps) => {
    const paths = usePathname();
    const pathNames = paths.split('/').filter((path) => path !== '');
    const baseParts = basePath.split('/').filter(Boolean);

    // Remove basePath segments from the beginning of the current path to avoid duplication in breadcrumbs
    const relativeParts =
        baseParts.length > 0 &&
        pathNames.slice(0, baseParts.length).every((p, i) => p === baseParts[i])
            ? pathNames.slice(baseParts.length)
            : pathNames;

    const basePrefix = basePath === '/' ? '' : basePath.replace(/\/$/, '');

    // Determine how many tail items to show when using ellipsis
    const safeMax = Math.max(2, maxItems);
    const tailCount = Math.max(1, safeMax - 2); // reserve 1 for home and 1 for ellipsis
    const needsEllipsis = relativeParts.length > tailCount;
    const sliceStart = needsEllipsis ? relativeParts.length - tailCount : 0;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href={homeHref}>{homeElement}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {relativeParts.length > 0 && (separator ?? <BreadcrumbSeparator/>)}
                {needsEllipsis && (
                    <>
                        <BreadcrumbItem className="hidden md:flex">
                            <BreadcrumbEllipsis/>
                        </BreadcrumbItem>
                        {separator ?? <BreadcrumbSeparator/>}
                    </>
                )}
                {relativeParts.map((link, index) => {
                    if (index < sliceStart) return null;
                    const href =
                        `${basePrefix}/${relativeParts.slice(0, index + 1).join('/')}`.replace(
                            /\/+/g,
                            '/'
                        );
                    const itemLink = capitalizeLinks
                        ? link[0].toUpperCase() + link.slice(1, link.length)
                        : link;

                    return (
                        <Fragment key={index}>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href={href}>{itemLink}</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {index < relativeParts.length - 1 &&
                                (separator ?? <BreadcrumbSeparator/>)}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
};
export default NavBreadCrumb;
