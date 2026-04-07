import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Upload, Progress, message, Button, Space, Typography } from 'antd';
import {
    CloudUploadOutlined,
    FileSearchOutlined,
    CheckCircleFilled,
    ExclamationCircleFilled,
    FolderOpenOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { initChunkUploadUser, uploadChunkUser, mergeChunksUser } from '@/http/api';
import { ChunkUploadType } from '@/type/api';
import HashWorker from './hash.worker?worker';
import './index.less';

const { Text } = Typography;

export interface BusinessConfig {
    schoolId?: string;
    courseId?: string;
    homeworkId?: string;
}

export interface FileChunkUploadProps {
    /** 上传成功后的回调，返回文件路径 */
    onChange: (path: string, fileId?: string) => void;
    /** 业务场景标识，传给后端 */
    scenario: string;
    /** 业务附加配置 */
    businessConfig?: BusinessConfig;
    /** 回显已挂载的文件路径 */
    previewPath?: string;
    /** 上传区域提示文字 */
    buttonText?: string;
    /** 最大文件体积（MB） */
    maxSizeMB?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否在分片上传后自动合并（false 则等外部主动调用 merge()） */
    autoMerge?: boolean;
    /** 文件类型，对应 ChunkUploadType */
    uploadType?: ChunkUploadType;
    /** 允许上传的文件类型，对应 <input accept> */
    accept?: string;
    /** 已挂载时展示的文件名（不传则从 previewPath 中截取） */
    previewFileName?: string;
    /** 已挂载状态的描述文字 */
    mountedLabel?: string;
    style?: React.CSSProperties;
}

export interface FileChunkUploadHandle {
    merge: () => Promise<string | undefined>;
}

enum UploadStatus {
    IDLE = 'IDLE',
    HASHING = 'HASHING',
    UPLOADING = 'UPLOADING',
    WAITING_MERGE = 'WAITING_MERGE',
    MERGING = 'MERGING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR'
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

const FileChunkUpload = forwardRef<FileChunkUploadHandle, FileChunkUploadProps>((
    {
        onChange,
        scenario,
        businessConfig = {},
        previewPath,
        buttonText = '选择并上传文件',
        maxSizeMB = 2048,
        disabled = false,
        autoMerge = true,
        uploadType = ChunkUploadType.NORMAL,
        accept,
        previewFileName,
        mountedLabel = '文件已挂载',
        style = {},
    },
    ref
) => {
    const deriveFileName = (path?: string) =>
        previewFileName || (path ? path.split('/').pop() || '' : '');

    const [status, setStatus] = useState<UploadStatus>(
        previewPath ? UploadStatus.SUCCESS : UploadStatus.IDLE
    );
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState(previewPath ? mountedLabel : '');
    const [currentFileName, setCurrentFileName] = useState<string>(deriveFileName(previewPath));

    const [uploadInfo, setUploadInfo] = useState<{
        uploadId: string;
        fileHash: string;
        fileName: string;
    } | null>(null);

    useEffect(() => {
        if (previewPath) {
            setStatus(UploadStatus.SUCCESS);
            setStatusText(mountedLabel);
            setProgress(100);
            setCurrentFileName(deriveFileName(previewPath));
            return;
        }
        setStatus(UploadStatus.IDLE);
        setStatusText('');
        setProgress(0);
        setCurrentFileName('');
        setUploadInfo(null);
    }, [previewPath]);

    // ── 手动合并（供外部 ref 调用）──────────────────────────────────────────
    const manualMerge = async () => {
        if (!uploadInfo) {
            message.warning('尚未完成分片上传，无法合并');
            return;
        }
        setStatus(UploadStatus.MERGING);
        setStatusText('正在合并分片...');
        try {
            const mergeRes = await mergeChunksUser({
                ...uploadInfo,
                scenario,
                courseId: String(businessConfig.courseId),
                schoolId: businessConfig.schoolId,
                homeworkId: businessConfig.homeworkId,
            });
            const { filePath, fileId, file_id } = mergeRes.data || {};
            const effectiveFileId = fileId || file_id;
            if (filePath) {
                onUploadComplete(filePath, effectiveFileId);
                return filePath;
            }
            throw new Error('合并失败，未返回路径');
        } catch (error: any) {
            setStatus(UploadStatus.ERROR);
            setStatusText(error.message || '合并出错');
            throw error;
        }
    };

    useImperativeHandle(ref, () => ({ merge: manualMerge }));

    // ── 核心上传流程 ────────────────────────────────────────────────────────
    const handleUpload = async (file: File) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
            message.error(`文件不能超过 ${maxSizeMB}MB`);
            return Upload.LIST_IGNORE;
        }

        setStatus(UploadStatus.HASHING);
        setStatusText('正在计算指纹...');
        setProgress(0);
        setCurrentFileName(file.name);

        try {
            // 1. Hash 计算（Web Worker）
            const fileHash = await calculateHash(file);

            // 2. 初始化
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const initRes = await initChunkUploadUser({
                fileHash,
                fileName: file.name,
                fileSize: file.size,
                totalChunks,
                courseId: String(businessConfig.courseId || ''),
                schoolId: businessConfig.schoolId,
                type: uploadType,
            });

            // 秒传
            if (initRes.data?.filePath) {
                const { filePath, fileId, file_id } = initRes.data;
                onUploadComplete(filePath, fileId || file_id);
                return;
            }

            const { uploadId, uploadedChunks = [] } = initRes.data;
            const uploadedSet = new Set<number>(uploadedChunks);

            // 3. 分片上传
            setStatus(UploadStatus.UPLOADING);
            setStatusText('正在上传分片...');

            for (let i = 0; i < totalChunks; i++) {
                if (uploadedSet.has(i)) continue;

                const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                const formData = new FormData();
                formData.append('file', chunk);
                formData.append('uploadId', uploadId);
                formData.append('chunkIndex', i.toString());
                formData.append('fileHash', fileHash);
                formData.append('scenario', scenario);
                if (businessConfig.schoolId) formData.append('schoolId', String(businessConfig.schoolId));
                if (businessConfig.courseId) formData.append('courseId', String(businessConfig.courseId));
                if (businessConfig.homeworkId) formData.append('homeworkId', String(businessConfig.homeworkId));

                await uploadChunkUser(formData);
                setProgress(Math.floor(((i + 1) / totalChunks) * 100));
            }

            const currentUploadInfo = { uploadId, fileHash, fileName: file.name };
            setUploadInfo(currentUploadInfo);

            // 4. 合并
            if (autoMerge) {
                setStatus(UploadStatus.MERGING);
                setStatusText('分片上传完成，正在合并...');
                const mergeRes = await mergeChunksUser({
                    ...currentUploadInfo,
                    scenario,
                    courseId: String(businessConfig.courseId),
                    schoolId: businessConfig.schoolId,
                    homeworkId: businessConfig.homeworkId,
                });
                const { filePath, fileId, file_id } = mergeRes.data || {};
                const effectiveFileId = fileId || file_id;
                if (filePath) {
                    onUploadComplete(filePath, effectiveFileId);
                } else {
                    throw new Error('合并失败，未返回路径');
                }
            } else {
                setStatus(UploadStatus.WAITING_MERGE);
                setStatusText('分片上传已完成，等待合并指令');
            }
        } catch (error: any) {
            console.error('Upload Error:', error);
            setStatus(UploadStatus.ERROR);
            setStatusText(error.message || '上传过程中出错');
        }
    };

    const calculateHash = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const worker = new HashWorker();
            worker.postMessage({ file, chunkSize: CHUNK_SIZE });
            worker.onmessage = (e: MessageEvent) => {
                const { type, progress: p, hash, error } = e.data;
                if (type === 'progress') setProgress(p);
                else if (type === 'success') { resolve(hash); worker.terminate(); }
                else if (type === 'error') { reject(new Error(error)); worker.terminate(); }
            };
        });

    const onUploadComplete = (path: string, fileId?: string) => {
        setStatus(UploadStatus.SUCCESS);
        setStatusText('上传成功');
        setProgress(100);
        onChange(path, fileId);
        message.success('文件上传成功');
    };

    // ── 渲染 ────────────────────────────────────────────────────────────────
    const uploadProps: UploadProps = {
        beforeUpload: (file) => { handleUpload(file); return false; },
        showUploadList: false,
        accept,
        disabled: disabled || (status !== UploadStatus.IDLE && status !== UploadStatus.SUCCESS && status !== UploadStatus.ERROR),
    };

    const renderContent = () => {
        switch (status) {
            case UploadStatus.HASHING:
            case UploadStatus.UPLOADING:
                return (
                    <div className="upload-progress-wrapper">
                        <Space direction="vertical" className="full-width-space">
                            <div className="upload-progress-header">
                                <Text strong>
                                    {status === UploadStatus.HASHING ? <FileSearchOutlined /> : <CloudUploadOutlined />} {statusText}
                                </Text>
                                <Text type="secondary">{progress}%</Text>
                            </div>
                            <Progress percent={progress} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
                            <Text type="secondary" ellipsis title={currentFileName} className="file-name-text">{currentFileName}</Text>
                        </Space>
                    </div>
                );

            case UploadStatus.WAITING_MERGE:
                return (
                    <div className="upload-status-card waiting-merge">
                        <CheckCircleFilled className="status-icon blue" />
                        <div className="status-text-wrapper">
                            <Text strong>{statusText}</Text>
                        </div>
                    </div>
                );

            case UploadStatus.MERGING:
                return (
                    <div className="upload-status-card merging">
                        <CloudUploadOutlined className="status-icon blue" />
                        <div className="status-text-wrapper">
                            <Text strong>{statusText}</Text>
                            <br />
                            <Text type="secondary">文件较大时可能需要较长时间</Text>
                        </div>
                    </div>
                );

            case UploadStatus.SUCCESS:
                return (
                    <Upload {...uploadProps} style={{ width: '100%' }}>
                        <div className="resource-card mounted">
                            <div className="card-inner">
                                <CheckCircleFilled className="status-icon green" />
                                <div>
                                    <Text strong>{mountedLabel}</Text>
                                    <br />
                                    <Text type="secondary" ellipsis title={currentFileName}>{currentFileName}</Text>
                                </div>
                                <Text className="re-upload-text">点击重新上传</Text>
                            </div>
                        </div>
                    </Upload>
                );

            case UploadStatus.ERROR:
                return (
                    <Upload {...uploadProps} style={{ width: '100%' }}>
                        <div className="resource-card error">
                            <div className="card-inner">
                                <ExclamationCircleFilled className="status-icon red" />
                                <div>
                                    <Text strong>上传失败</Text>
                                    <br />
                                    <Text type="secondary">{statusText}</Text>
                                </div>
                                <Button size="small" type="primary" danger className="status-btn">重新上传</Button>
                            </div>
                        </div>
                    </Upload>
                );

            default:
                return (
                    <Upload {...uploadProps} style={{ width: '100%' }}>
                        <div className="resource-card empty">
                            <div className="card-inner">
                                <FolderOpenOutlined className="status-icon-large" />
                                <p className="upload-desc">{buttonText}</p>
                                <Text className="upload-hint">支持分片断点续传，最大可上传 {maxSizeMB / 1024}GB</Text>
                            </div>
                        </div>
                    </Upload>
                );
        }
    };

    return (
        <div className="file-chunk-upload-container" style={style}>
            {renderContent()}
        </div>
    );
});

export default FileChunkUpload;
