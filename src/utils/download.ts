import http from '@/http/http.js';
import { message } from 'antd';

/**
 * 带有 Authorization 头的文件下载工具函数
 * @param params { schoolId, fileHash, fileName }
 */
export const downloadFile = async (params: { schoolId: string | number, fileHash: string, fileName: string }) => {
    const { schoolId, fileHash, fileName } = params;
    const url = `/file/download?schoolId=${schoolId}&fileHash=${fileHash}`;
    const hide = message.loading('正在准备下载...', 0);
    try {
        const response: any = await http.get(url, {
            responseType: 'blob',
        });

        // 创建 blob 链接
        const blob = new Blob([response]);
        const blobUrl = window.URL.createObjectURL(blob);
        
        // 创建隐藏的 a 标签并触发点击
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // 清理
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
        console.error('Download failed:', error);
    } finally {
        hide();
    }
};
