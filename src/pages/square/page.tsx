'use client';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Download, Eye, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { useMemo, useState, useLayoutEffect } from 'react';
import { Link } from 'react-router';
import { useSquarePresets } from '@/hooks/use-square-presets';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SquareStatsPeriod } from '@/types/square';

const sortOptions = [
    { value: 'views', label: '浏览最多' },
    {
        value: 'downloads',
        label: '下载最多',
    },
    { value: 'rating', label: '评分最高' },
    { value: 'newest', label: '最新发布' },
];

const periodOptions: { value: SquareStatsPeriod; label: string }[] = [
    { value: 'all', label: '总榜' },
    { value: 'day', label: '日榜' },
    { value: 'week', label: '周榜' },
    { value: 'month', label: '月榜' },
];

import { motion } from 'framer-motion';

export default function SquarePage() {
    const [search, setSearch] = useState('');
    const [sortOption, setSortOption] = useState('views');
    const [period, setPeriod] = useState<SquareStatsPeriod>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [refresh, setRefresh] = useState(false);

    const itemsPerPage = 12;

    const keywords = useMemo(() => search.split(' ').filter(Boolean), [search]);
    const { presets: sourcePresets, isLoading } = useSquarePresets(
        sortOption,
        keywords,
        refresh,
        period
    );
    const totalPages = Math.ceil(sourcePresets.length / itemsPerPage);

    const currentData = useMemo(
        () =>
            sourcePresets.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
            ),
        [sourcePresets, currentPage]
    );

    const getPaginationRange = () => {
        const start = Math.max(1, currentPage - 1);
        const end = Math.min(totalPages, start + 3);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const paginationRange = getPaginationRange();

    useLayoutEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                setRefresh(true);
                setTimeout(() => {
                    setRefresh(false);
                }, 10);
            }
        };

        window.addEventListener('pageshow', handlePageShow);

        return () => {
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);

    if (isLoading) {
        return (
            <main className="flex min-h-full items-center justify-center px-6 py-16">
                <div className="flex flex-col items-center text-center">
                    <img
                        src="/images/loading.svg"
                        alt="正在加载预设"
                        width="800"
                        height="680"
                        className="mb-6 h-48 w-56 object-contain dark:brightness-125"
                    />
                    <p className="text-base font-medium">加载中</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        正在获取广场预设...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <div className="container px-4 py-6 sm:px-6 lg:px-8">
                {/* Search and Filters */}
                <div className="sticky top-0 z-20 -mx-4 mb-8 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="搜索预设..."
                                className="pl-9 bg-background"
                                value={search}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSearch(value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <Select
                            value={sortOption}
                            onValueChange={(value) => {
                                setSortOption(value);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="排序方式" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {(sortOption === 'views' || sortOption === 'downloads') && (
                        <Tabs
                            value={period}
                            onValueChange={(value) => {
                                setPeriod(value as SquareStatsPeriod);
                                setCurrentPage(1);
                            }}
                        >
                            <TabsList
                                aria-label="统计时间范围"
                                className="grid h-10 w-full grid-cols-4 p-1 sm:flex sm:h-9 sm:w-fit"
                            >
                                {periodOptions.map((option) => (
                                    <TabsTrigger
                                        key={option.value}
                                        value={option.value}
                                        className="px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
                                    >
                                        {option.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    )}
                </div>

                {/* Presets Grid */}
                <motion.div
                    key={currentPage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    style={{ gridTemplateRows: 'masonry' }}
                >
                    {currentData.map((preset) => (
                        <Link
                            to={`/square/${preset.sha1}`}
                            key={preset.rawPath}
                            className="flex flex-col"
                        >
                            <Card className="break-inside-avoid h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold mb-1 overflow-hidden whitespace-nowrap max-w-[200px] text-ellipsis">
                                                {preset.keywords?.[0] ??
                                                    preset.name}
                                            </CardTitle>
                                        </div>
                                        <Badge variant="outline">
                                            {preset.type === 'main'
                                                ? '主插件预设'
                                                : '伪装预设'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 flex flex-col flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-7 flex-grow">
                                        {preset?.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {preset.tags?.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="rounded-sm"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <Download className="h-4 w-4" />
                                                <span>
                                                    {preset.meta?.downloads ?? 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-4 w-4" />
                                                <span>
                                                    {preset.meta?.views ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Star className="h-4 w-4 fill-current" />
                                            <span className="font-medium">
                                                {preset?.rating ?? 0.0}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </motion.div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1)
                                        )
                                    }
                                    className={
                                        currentPage === 1
                                            ? 'pointer-events-none opacity-50'
                                            : ''
                                    }
                                />
                            </PaginationItem>

                            {paginationRange.map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(page)}
                                        isActive={currentPage === page}
                                        className={
                                            currentPage === page
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                                : ''
                                        }
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    className={
                                        currentPage === totalPages
                                            ? 'pointer-events-none opacity-50'
                                            : ''
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
        </div>
    );
}
