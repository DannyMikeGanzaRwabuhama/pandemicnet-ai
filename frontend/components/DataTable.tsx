'use client';

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import {Checkbox} from '@/components/ui/checkbox';
import {Button} from '@/components/ui/button';
import {ArrowUpDown, ChevronDown, MoreHorizontal} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {useState} from 'react';
import {Input} from '@/components/ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Superspreader} from '@/lib/types';

// Generic DataTable props
interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    filterColumn?: string; // Optional: column to filter on (e.g., 'unique_id' for Superspreader)
    title?: string; // Optional: table title
}

export function DataTable<T>({data, columns, filterColumn, title}: DataTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <div className="w-full max-w-3xl mx-auto p-4">
            {title && <h1 className="text-2xl font-semibold mb-4">{title}</h1>}
            <div className="flex items-center py-4">
                {filterColumn && (
                    <Input
                        placeholder={`Filter by ${filterColumn}...`}
                        value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ''}
                        onChange={(event) => table.getColumn(filterColumn)?.setFilterValue(event.target.value)}
                        className="max-w-sm"
                    />
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(value)}
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} rows selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Define columns for Superspreader data
export const superspreaderColumns: ColumnDef<Superspreader>[] = [
    {
        id: 'select',
        header: ({table}) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
                aria-label="Select all rows"
            />
        ),
        cell: ({row}) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'unique_id',
        header: ({column}) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                ID
                <ArrowUpDown/>
            </Button>
        ),
        cell: ({row}) => <div className="font-semibold">{row.getValue('unique_id')}</div>,
    },
    {
        accessorKey: 'contact_count',
        header: 'Total Contacts',
        cell: ({row}) => <div>{row.getValue('contact_count')}</div>,
    },
    {
        accessorKey: 'infected_contacts',
        header: 'Infected Contacts',
        cell: ({row}) => <div>{row.getValue('infected_contacts') ?? 0}</div>,
    },
    {
        accessorKey: 'infection_date',
        header: 'Infection Date',
        cell: ({row}) => {
            const date = row.getValue('infection_date') as string | undefined;
            return <div>{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>;
        },
    },
    {
        accessorKey: 'location',
        header: 'Location',
        cell: ({row}) => <div>{row.getValue('location') ?? 'N/A'}</div>,
    },
    {
        accessorKey: 'centrality_score',
        header: 'Centrality Score',
        cell: ({row}) => {
            const score = row.getValue('centrality_score') as number | undefined;
            return <div>{score ? score.toFixed(3) : 'N/A'}</div>;
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({row}) => {
            const spreader = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0">
                            <span className="sr-only">Open Actions Menu</span>
                            <MoreHorizontal/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-sm capitalize">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(spreader.unique_id)}>
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem>View details</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];