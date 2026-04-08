import type { StatisticsQueryParams } from '@/type/api';

const normalizeString = (value?: string | null) => {
    const next = String(value || '').trim();
    return next || undefined;
};

export const normalizeStatisticsQueryParams = (params: StatisticsQueryParams = {}): StatisticsQueryParams => {
    return {
        courseId: normalizeString(params.courseId),
        teachingGroupId: normalizeString(params.teachingGroupId),
        assignmentId: normalizeString(params.assignmentId),
        startTime: normalizeString(params.startTime),
        endTime: normalizeString(params.endTime),
        page: params.page,
        pageSize: params.pageSize,
        sortBy: normalizeString(params.sortBy),
        sortOrder: params.sortOrder,
    };
};

export const mergeStatisticsQueryParams = (...sources: Array<StatisticsQueryParams | undefined | null>): StatisticsQueryParams => {
    const merged: StatisticsQueryParams = {};

    sources.forEach((source) => {
        if (!source) {
            return;
        }

        const normalized = normalizeStatisticsQueryParams(source);
        (Object.keys(normalized) as Array<keyof StatisticsQueryParams>).forEach((key) => {
            if (normalized[key] !== undefined) {
                merged[key] = normalized[key] as any;
            }
        });
    });

    return merged;
};

export const readStatisticsQueryParamsFromSearch = (search: string): StatisticsQueryParams => {
    const query = new URLSearchParams(search || '');
    return normalizeStatisticsQueryParams({
        courseId: query.get('courseId') || undefined,
        teachingGroupId: query.get('teachingGroupId') || undefined,
        assignmentId: query.get('assignmentId') || undefined,
        startTime: query.get('startTime') || undefined,
        endTime: query.get('endTime') || undefined,
        page: query.get('page') ? Number(query.get('page')) : undefined,
        pageSize: query.get('pageSize') ? Number(query.get('pageSize')) : undefined,
        sortBy: query.get('sortBy') || undefined,
        sortOrder: (query.get('sortOrder') as any) || undefined,
    });
};

export const normalizeArrayData = <T = any>(value: unknown): T[] => {
    return Array.isArray(value) ? (value as T[]) : [];
};

export const normalizeObjectData = <T extends Record<string, any>>(value: unknown, fallback: T): T => {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
        return fallback;
    }
    return value as T;
};

export const normalizeNullableData = <T>(value: T | null | undefined, fallback: T): T => {
    if (value === null || value === undefined) {
        return fallback;
    }
    return value;
};

export const parseStatisticsErrorMessage = (error: any, fallback = '统计数据加载失败，请稍后重试') => {
    const directMessage = String(error?.response?.data?.msg || error?.msg || error?.message || '').trim();
    return directMessage || fallback;
};

export const formatUnixTime = (value?: string | number | null) => {
    const unix = Number(value);
    if (!unix || Number.isNaN(unix)) {
        return '-';
    }

    const date = new Date(unix * 1000);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatRemainSeconds = (seconds: number) => {
    const safeSeconds = Number(seconds || 0);
    if (Number.isNaN(safeSeconds)) {
        return '截止时间未知';
    }

    if (safeSeconds <= 0) {
        return '已截止';
    }

    const day = Math.floor(safeSeconds / 86400);
    const hour = Math.floor((safeSeconds % 86400) / 3600);
    const minute = Math.floor((safeSeconds % 3600) / 60);

    if (day > 0) {
        return `剩余 ${day} 天 ${hour} 小时`;
    }

    if (hour > 0) {
        return `剩余 ${hour} 小时 ${minute} 分钟`;
    }

    return `剩余 ${Math.max(minute, 1)} 分钟`;
};

export const createLatestRequestGuard = () => {
    let cursor = 0;

    return {
        next: () => {
            cursor += 1;
            return cursor;
        },
        isLatest: (requestId: number) => {
            return requestId === cursor;
        },
    };
};