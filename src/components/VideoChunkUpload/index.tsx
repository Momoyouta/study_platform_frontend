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
import { initChunkUploadUser, uploadChunkUser, mergeChunksUser, ChunkUploadType } from '@/http/api';
import HashWorker from './hash.worker?worker';
import './index.less';

const { Text } = Typography;

export interface BusinessConfig {
    schoolId?: number;
    courseId?: string | number;
    homeworkId?: number;
}

interface VideoChunkUploadProps {
    onChange: (path: string) => void;
    scenario: string;
    businessConfig?: BusinessConfig;
    previewPath?: string;
    buttonText?: string;
    maxSizeMB?: number;
    disabled?: boolean;
    autoMerge?: boolean;
    style?: React.CSSProperties; // 新增：样式支持
}

export interface VideoChunkUploadHandle {
    merge: () => Promise<string | undefined>;
}

enum UploadStatus {
    IDLE = 'IDLE',
    HASHING = 'HASHING',
    UPLOADING = 'UPLOADING',
    WAITING_MERGE = 'WAITING_MERGE', // 新增：等待合并状态
    MERGING = 'MERGING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR'
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB 分片

const VideoChunkUpload = forwardRef<VideoChunkUploadHandle, VideoChunkUploadProps>(({
    onChange,
    scenario,
    businessConfig = {},
    previewPath,
    buttonText = '选择并上传视频',
    maxSizeMB = 2048,
    disabled = false,
    autoMerge = true,
    style = {} // 新增：默认值
}, ref) => {
    const [status, setStatus] = useState<UploadStatus>(previewPath ? UploadStatus.SUCCESS : UploadStatus.IDLE);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState(previewPath ? '视频已挂载' : '');
    const [currentFileName, setCurrentFileName] = useState<string>(previewPath ? previewPath.split('/').pop() || '' : '');

    // 存储合并所需的信息
    const [uploadInfo, setUploadInfo] = useState<{
        uploadId: string;
        fileHash: string;
        fileName: string;
    } | null>(null);

    useEffect(() => {
        if (previewPath) {
            const fileName = previewPath.split('/').pop() || '';
            setStatus(UploadStatus.SUCCESS);
            setStatusText('视频已挂载');
            setProgress(100);
            setCurrentFileName(fileName);
            return;
        }

        setStatus(UploadStatus.IDLE);
        setStatusText('');
        setProgress(0);
        setCurrentFileName('');
        setUploadInfo(null);
    }, [previewPath]);

    // 暴露给外部的合并方法
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
                homeworkId: businessConfig.homeworkId
            });

            if (mergeRes.data?.filePath) {
                onUploadComplete(mergeRes.data.filePath);
                return mergeRes.data.filePath;
            } else {
                throw new Error('合并失败，未返回路径');
            }
        } catch (error: any) {
            setStatus(UploadStatus.ERROR);
            setStatusText(error.message || '合并出错');
            message.error(error.message || '合并失败');
            throw error;
        }
    };

    useImperativeHandle(ref, () => ({
        merge: manualMerge
    }));

    const handleUpload = async (file: File) => {
        // 1. 校验大小
        if (file.size > maxSizeMB * 1024 * 1024) {
            message.error(`文件不能超过 ${maxSizeMB}MB`);
            return Upload.LIST_IGNORE;
        }

        setStatus(UploadStatus.HASHING);
        setStatusText('正在计算指纹...');
        setProgress(0);
        setCurrentFileName(file.name);

        try {
            // 2. 计算 Hash (Web Worker)
            const fileHash = await calculateHash(file);

            // 3. 初始化上传
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const initRes = await initChunkUploadUser({
                fileHash,
                fileName: file.name,
                fileSize: file.size,
                totalChunks,
                courseId: String(businessConfig.courseId || ''),
                schoolId: businessConfig.schoolId,
                type: ChunkUploadType.VIDEO
            });

            // 检查是否秒传成功
            if (initRes.data?.filePath) {
                onUploadComplete(initRes.data.filePath);
                return;
            }

            const { uploadId, uploadedChunks = [] } = initRes.data;
            const uploadedSet = new Set<number>(uploadedChunks);

            // 4. 开始分片上传
            setStatus(UploadStatus.UPLOADING);
            setStatusText('正在上传分片...');

            for (let i = 0; i < totalChunks; i++) {
                if (uploadedSet.has(i)) {
                    continue;
                }

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

                // 更新进度
                const uploadedCount = i + 1;
                setProgress(Math.floor((uploadedCount / totalChunks) * 100));
            }

            // 保存合并信息
            const currentUploadInfo = {
                uploadId,
                fileHash,
                fileName: file.name
            };
            setUploadInfo(currentUploadInfo);

            // 5. 判断是否自动合并
            if (autoMerge) {
                setStatus(UploadStatus.MERGING);
                setStatusText('分片上传完成，正在合并...');
                const mergeRes = await mergeChunksUser({
                    ...currentUploadInfo,
                    scenario,
                    courseId: String(businessConfig.courseId),
                    schoolId: businessConfig.schoolId,
                    homeworkId: businessConfig.homeworkId
                });

                if (mergeRes.data?.filePath) {
                    onUploadComplete(mergeRes.data.filePath);
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
            message.error(error.message || '上传失败');
        }
    };

    const calculateHash = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const worker = new HashWorker();
            worker.postMessage({ file, chunkSize: CHUNK_SIZE });
            worker.onmessage = (e: MessageEvent) => {
                const { type, progress, hash, error } = e.data;
                if (type === 'progress') {
                    setProgress(progress);
                } else if (type === 'success') {
                    resolve(hash);
                    worker.terminate();
                } else if (type === 'error') {
                    reject(new Error(error));
                    worker.terminate();
                }
            };
        });
    };

    const onUploadComplete = (path: string) => {
        setStatus(UploadStatus.SUCCESS);
        setStatusText('上传成功');
        setProgress(100);
        onChange(path);
        message.success('视频上传成功');
    };

    const uploadProps: UploadProps = {
        beforeUpload: (file) => {
            handleUpload(file);
            return false;
        },
        showUploadList: false,
        accept: 'video/*',
        disabled: disabled || (status !== UploadStatus.IDLE && status !== UploadStatus.SUCCESS && status !== UploadStatus.ERROR)
    };

    const renderContent = () => {
        switch (status) {
            case UploadStatus.HASHING:
            case UploadStatus.UPLOADING:
                return (
                    <div className="upload-progress-wrapper">
                        <Space direction="vertical" className="full-width-space">
                            <div className="upload-progress-header">
                                <Text strong>{status === UploadStatus.HASHING ? <FileSearchOutlined /> : <CloudUploadOutlined />} {statusText}</Text>
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
                                    <Text strong>视频挂载成功</Text>
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
        <div className="video-chunk-upload-container" style={style}>
            {renderContent()}
        </div>
    );
});
export default VideoChunkUpload;
