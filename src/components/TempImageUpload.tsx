import { useEffect, useState } from 'react';
import { Button, Upload, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { uploadImageTemp } from '@/http/api';
import { toViewFileUrl } from '@/utils/fileUrl';

type TempImageUploadProps = {
    onChange: (tempPath: string) => void;
    variant?: 'button' | 'picture-card';
    previewPath?: string;
    buttonText?: string;
    accept?: string;
    allowedMimeTypes?: string[];
    maxSizeMB?: number;
    successMessage?: string;
    invalidTypeMessage?: string;
    oversizeMessage?: string;
    showUploadList?: UploadProps['showUploadList'];
    disabled?: boolean;
    onUploadingChange?: (uploading: boolean) => void;
};

const ensureSuccess = (response: any, fallbackMsg: string) => {
    if (response?.code !== undefined && response.code !== 0 && response.code !== 200) {
        throw new Error(response?.msg || fallbackMsg);
    }
    return response?.data ?? response;
};

const resolveUploadedPath = (payload: any) => {
    return payload?.path ?? payload?.url ?? payload;
};

const buildPreviewFile = (path: string): UploadFile => {
    const normalizedPath = String(path || '');
    return {
        uid: '-1',
        name: normalizedPath.split('/').pop() || 'avatar',
        status: 'done',
        url: toViewFileUrl(normalizedPath),
    };
};

const TempImageUpload = ({
    onChange,
    variant = 'button',
    previewPath,
    buttonText = '上传图片',
    accept,
    allowedMimeTypes,
    maxSizeMB = 5,
    successMessage = '图片上传成功',
    invalidTypeMessage = '只能上传图片文件',
    oversizeMessage,
    showUploadList,
    disabled,
    onUploadingChange,
}: TempImageUploadProps) => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const isPictureCard = variant === 'picture-card';
    const uploadListConfig = showUploadList || (isPictureCard ? { showPreviewIcon: false, showRemoveIcon: true } : { showPreviewIcon: false });
    const maxSizeError = oversizeMessage || `图片大小必须小于 ${maxSizeMB}MB`;

    useEffect(() => {
        if (!isPictureCard) {
            return;
        }

        if (previewPath) {
            setFileList([buildPreviewFile(previewPath)]);
            return;
        }

        setFileList([]);
    }, [previewPath, isPictureCard]);

    const beforeUpload = (file: File) => {
        const isImage = Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0
            ? allowedMimeTypes.includes(file.type)
            : file.type.startsWith('image/');
        if (!isImage) {
            message.error(invalidTypeMessage);
            return Upload.LIST_IGNORE;
        }

        const isLt5M = file.size / 1024 / 1024 < maxSizeMB;
        if (!isLt5M) {
            message.error(maxSizeError);
            return Upload.LIST_IGNORE;
        }

        return true;
    };

    const handleUploadChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        const latestFileList = newFileList.slice(-1).map((fileItem) => {
            if (fileItem.url) {
                return fileItem;
            }

            const uploadedPath = resolveUploadedPath(fileItem.response?.data ?? fileItem.response);
            if (uploadedPath && typeof uploadedPath === 'string') {
                return {
                    ...fileItem,
                    url: toViewFileUrl(uploadedPath),
                };
            }

            return fileItem;
        });

        setFileList(latestFileList);
        if (newFileList.length === 0) {
            onChange?.('');
        }
    };

    const customUpload: UploadProps['customRequest'] = async (options) => {
        const { file, onSuccess, onError } = options;

        setUploading(true);
        onUploadingChange?.(true);
        try {
            const uploadRes = await uploadImageTemp(file as File);
            const payload = ensureSuccess(uploadRes, '图片上传失败');
            const uploadedPath = resolveUploadedPath(payload);
            if (!uploadedPath || typeof uploadedPath !== 'string') {
                throw new Error('上传接口未返回可用图片路径');
            }

            onChange?.(uploadedPath);
            message.success(successMessage);
            onSuccess?.(uploadRes as any);
        } catch (error: any) {
            message.error(error?.message || '图片上传失败，请稍后重试');
            onError?.(error as any);
        } finally {
            setUploading(false);
            onUploadingChange?.(false);
        }
    };

    return (
        <Upload
            fileList={fileList}
            maxCount={1}
            listType={isPictureCard ? 'picture-card' : undefined}
            customRequest={customUpload}
            beforeUpload={beforeUpload}
            onChange={handleUploadChange}
            showUploadList={uploadListConfig}
            accept={accept}
            disabled={disabled || uploading}
        >
            {isPictureCard ? (
                fileList.length >= 1 ? null : (
                    <div>
                        <PlusOutlined style={{ fontSize: 32, color: '#ccc' }} />
                    </div>
                )
            ) : (
                <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
                    {buttonText}
                </Button>
            )}
        </Upload>
    );
};

export default TempImageUpload;