import { sha1 } from '@/lib/utils';
import { CharacterPresetTemplate, RawPreset } from '@/types/preset';
import {
    SquarePresetData,
    SquarePresetDataView,
    SquareStatsPeriod,
} from '@/types/square';
import { load } from 'js-yaml';
import { useState, useEffect, useMemo, useRef } from 'react';

// 缓存管理对象
const cacheManager = {
    presets: {
        data: null as SquarePresetData[] | null,
        timestamp: 0,
        ttl: 3600_000, // 1小时缓存
    },
    presetData: new Map<string, SquarePresetDataView>(),
    presetContent: new Map<string, string>(),
};

const API_URL = 'https://api-chatluna-preset-market.dingyi222666.top';

// 通用请求处理器
const fetchWithCache = async <T>({
    url,
    cacheKey,
    parser,
    ttl,
}: {
    url: string;
    cacheKey: keyof typeof cacheManager;
    parser: (response: Response) => Promise<T>;
    ttl: number;
}): Promise<T> => {
    if (cacheKey !== 'presets') {
        return;
    }

    const now = Date.now();
    const cache = cacheManager[cacheKey];

    if (cache.data && now - cache.timestamp < ttl) {
        return cache.data as T;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${cacheKey}`);

    const data = await parser(response);
    cacheManager[cacheKey].data = data as SquarePresetData[];
    cacheManager[cacheKey].timestamp = now;

    return data;
};

// 获取预设列表
const fetchPresets = async (): Promise<SquarePresetData[]> => {
    try {
        return await fetchWithCache({
            url: `https://gcore.jsdelivr.net/gh/chatlunalab/awesome-chatluna-presets@preset/presets.json?t=${Date.now()}`,
            cacheKey: 'presets',
            parser: async (response) => {
                const data = (await response.json()) as SquarePresetData[];
                await Promise.all(
                    data.map(async (preset) => {
                        preset.sha1 = await sha1(preset.rawPath);
                    })
                );
                return data;
            },
            ttl: cacheManager.presets.ttl,
        });
    } catch (error) {
        console.error('Error fetching presets:', error);
        return [];
    }
};

// 将数组分块的工具函数
const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// 获取预设元数据
export const fetchPresetData = async (
    presets: SquarePresetData[],
    period: SquareStatsPeriod = 'all',
    forceRefresh = false
): Promise<SquarePresetDataView[]> => {
    const presetPaths = presets.map((p) => p.rawPath);
    const getCacheKey = (path: string) => `${period}:${path}`;
    const cachedData = presetPaths
        .map((path) => cacheManager.presetData.get(getCacheKey(path)))
        .filter(Boolean) as SquarePresetDataView[];

    if (!forceRefresh && cachedData.length === presetPaths.length) {
        return cachedData.sort((a, b) => b.path.localeCompare(a.path));
    }

    try {
        const CHUNK_SIZE = 50;
        const chunks = chunkArray(presetPaths, CHUNK_SIZE);
        const allData: SquarePresetDataView[] = [];

        for (const chunk of chunks) {
            const response = await fetch(`${API_URL}/query_preset_views`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ presetPaths: chunk, period }),
            });

            if (!response.ok) throw new Error('Failed to fetch preset data');

            const chunkData = (await response.json()) as SquarePresetDataView[];
            const dataByPath = new Map(
                chunkData.map((data) => [data.path, data])
            );
            const normalizedData = chunk.map(
                (path) => dataByPath.get(path) ?? { path, views: 0, downloads: 0 }
            );
            normalizedData.forEach((data) =>
                cacheManager.presetData.set(getCacheKey(data.path), data)
            );
            allData.push(...normalizedData);
        }

        return allData.sort((a, b) => b.path.localeCompare(a.path));
    } catch (error) {
        console.error('Error fetching preset data:', error);
        return [];
    }
};

// 排序策略
const sortStrategies = {
    downloads: (a: SquarePresetData, b: SquarePresetData) =>
        (b.meta?.downloads || 0) - (a.meta?.downloads || 0),
    views: (a: SquarePresetData, b: SquarePresetData) =>
        (b.meta?.views || 0) - (a.meta?.views || 0),
    rating: (a: SquarePresetData, b: SquarePresetData) => b.rating - a.rating,
    newest: (a: SquarePresetData, b: SquarePresetData) =>
        b.modified - a.modified,
};

// 关键词过滤
const filterByKeywords = (preset: SquarePresetData, keywords: string[]) => {
    const lowerKeywords = keywords?.map((k) => k?.toLowerCase() ?? '') ?? [];
    const presetType = preset.type === 'main' ? '主插件' : '伪装';

    return lowerKeywords.some(
        (keyword) =>
            (preset.name?.toLowerCase().includes(keyword) ?? false) ||
            (preset.description?.toLowerCase().includes(keyword) ?? false) ||
            presetType.includes(keyword) ||
            (preset.tags?.some((tag) => tag.toLowerCase().includes(keyword)) ??
                false)
    );
};

export function useSquarePresets(
    sortOption: string,
    keywords: string[],
    refresh: boolean,
    period: SquareStatsPeriod
) {
    const [presets, setPresets] = useState<SquarePresetData[]>([]);
    const [presetDataState, setPresetDataState] = useState<{
        period: SquareStatsPeriod;
        data: SquarePresetDataView[];
    }>({ period, data: [] });
    const [isLoading, setIsLoading] = useState(true);

    // 获取所有预设数据
    useEffect(() => {
        let cancelled = false;

        void fetchPresets()
            .then((data) => {
                if (!cancelled) {
                    setPresets(data);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // 根据排序和过滤条件处理预设数据
    const sortedPresets = useMemo(() => {
        const presetData =
            presetDataState.period === period ? presetDataState.data : [];
        const dataByPath = new Map(presetData.map((data) => [data.path, data]));
        let sorted = [...presets].map((p) => {
            const meta = dataByPath.get(p.rawPath);
            return { ...p, meta };
        });

        if (sortOption in sortStrategies) {
            sorted = sorted.sort(sortStrategies[sortOption]);
        }

        return keywords.length
            ? sorted.filter((p) => filterByKeywords(p, keywords))
            : sorted;
    }, [presets, sortOption, keywords, presetDataState, period]);

    // 获取当前时间范围的预设统计数据
    useEffect(() => {
        let cancelled = false;

        if (presets.length > 0) {
            void fetchPresetData(presets, period, refresh).then((data) => {
                if (!cancelled) {
                    setPresetDataState({ period, data });
                }
            });
        }

        return () => {
            cancelled = true;
        };
    }, [presets, period, refresh]);

    const presetData =
        presetDataState.period === period ? presetDataState.data : [];

    return {
        presets: sortedPresets,
        presetDataList: presetData,
        isLoading,
    };
}

// 通用统计递增方法
const incrementStat = async (id: string, type: 'views' | 'downloads') => {
    try {
        const response = await fetch(
            `${API_URL}/increment_preset_${type}?path=${id}`,
            { headers: { 'Content-Type': 'application/json' } }
        );
        if (!response.ok) throw new Error(`Failed to increment ${type}`);
        return response;
    } catch (error) {
        console.error(`Error incrementing ${type}:`, error);
        throw error;
    }
};

export function clearPresetViewCache() {
    cacheManager.presetData.clear();
}

export const incrementViews = (id: string) => incrementStat(id, 'views');
export const incrementDownloads = (id: string) =>
    incrementStat(id, 'downloads');

export function useSquarePreset(id: string) {
    const [preset, setPreset] = useState<SquarePresetData>();
    const [loadedId, setLoadedId] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        if (!id) {
            return;
        }

        const requestId = ++requestIdRef.current;
        let cancelled = false;

        const applyResult = (data: SquarePresetData[] | undefined) => {
            if (cancelled || requestId !== requestIdRef.current) {
                return;
            }
            setPreset(data?.find((p) => p.sha1 === id));
            setLoadedId(id);
        };

        if (cacheManager.presets.data) {
            // Defer cache read so setState is not synchronous in the effect body.
            queueMicrotask(() => applyResult(cacheManager.presets.data ?? undefined));
        } else {
            fetchPresets().then((data) => applyResult(data));
        }

        return () => {
            cancelled = true;
        };
    }, [id]);

    const isLoading = Boolean(id) && loadedId !== id;
    const resolvedPreset = loadedId === id ? preset : undefined;

    return { preset: resolvedPreset, isLoading };
}

// 预设内容加载
const loadPresetContent = async (url: string) => {
    if (cacheManager.presetContent.has(url)) {
        return cacheManager.presetContent.get(url)!;
    }

    const response = await fetch(url);
    const content = await response.text();
    cacheManager.presetContent.set(url, content);
    return content;
};

export const loadPresetForNetwork = async (url: string) => {
    const content = await loadPresetContent(url);
    return load(content) as RawPreset | CharacterPresetTemplate;
};

export function useSquarePresetForNetwork(squarePreset: SquarePresetData) {
    const [preset, setPreset] = useState<RawPreset | CharacterPresetTemplate>();
    const cdnUrl = useMemo(
        () =>
            squarePreset.rawPath.replace(
                'https://raw.githubusercontent.com/ChatLunaLab/awesome-chatluna-presets/main/presets',
                'https://gcore.jsdelivr.net/gh/chatlunalab/awesome-chatluna-presets@main/presets'
            ),
        [squarePreset.rawPath]
    );

    useEffect(() => {
        loadPresetForNetwork(cdnUrl).then(setPreset);
    }, [cdnUrl]);

    return preset;
}

export async function downloadPreset(preset: SquarePresetData) {
    const url = preset.rawPath.replace(
        'https://raw.githubusercontent.com/ChatLunaLab/awesome-chatluna-presets/main/presets',
        'https://gcore.jsdelivr.net/gh/chatlunalab/awesome-chatluna-presets@main/presets'
    );

    const blob = await fetch(url).then((r) => r.blob());
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${preset.name}.yml`;
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        document.body.removeChild(anchor);
    }, 100);
}
