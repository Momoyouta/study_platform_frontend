export const buildFileViewUrl = (path?: string) => {
    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const baseUrl = (import.meta as any).env?.VITE_FILE_BASE_URL || '';
    if (!baseUrl) {
        return path;
    }

    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.replace(/\\/g, '/').startsWith('/') ? path.replace(/\\/g, '/') : `/${path.replace(/\\/g, '/')}`;

    return `${normalizedBaseUrl}${normalizedPath}`;
};
