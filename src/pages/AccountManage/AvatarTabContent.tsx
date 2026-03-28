import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Avatar, Button, Upload, message } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import Store from '@/store/index';
import { uploadImageTemp, updateAvatar } from '@/http/api';
import { buildFileViewUrl } from '@/utils/fileUrl';
import './AvatarTabContent.less';

const ensureSuccess = (response: any, fallbackMsg: string) => {
    if (response?.code !== undefined && response.code !== 0 && response.code !== 200) {
        throw new Error(response?.msg || fallbackMsg);
    }
    return response?.data ?? response;
};

const patchUserAvatar = (avatarPath: string) => {
    const userStore = Store.UserStore;
    userStore.setUserFromDto({
        id: userStore.userId,
        name: userStore.userName,
        role_id: userStore.roleId,
        sex: userStore.sex ?? true,
        account: userStore.account,
        phone: userStore.phone,
        avatar: avatarPath,
        create_time: userStore.createTime,
        update_time: userStore.updateTime,
        status: userStore.status ?? undefined,
    });
};

const AvatarTabContent = observer(() => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [tempAvatarPath, setTempAvatarPath] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const userStore = Store.UserStore;

    const displayAvatar = useMemo(() => {
        return buildFileViewUrl(tempAvatarPath || userStore.avatar);
    }, [tempAvatarPath, userStore.avatar]);

    const beforeUpload = (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('只能上传图片文件');
            return Upload.LIST_IGNORE;
        }

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('图片大小必须小于 5MB');
            return Upload.LIST_IGNORE;
        }

        return true;
    };

    const onUploadChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1));
        if (newFileList.length === 0) {
            setTempAvatarPath('');
        }
    };

    const customUpload: UploadProps['customRequest'] = async (options) => {
        const { file, onSuccess, onError } = options;

        setUploading(true);
        try {
            const uploadRes = await uploadImageTemp(file as File);
            const payload = ensureSuccess(uploadRes, '头像上传失败');
            const uploadedPath = payload?.path ?? payload?.url ?? payload;

            if (!uploadedPath || typeof uploadedPath !== 'string') {
                throw new Error('上传接口未返回可用图片路径');
            }

            setTempAvatarPath(uploadedPath);
            message.success('头像上传成功，请点击“保存头像”生效');
            onSuccess?.(uploadRes as any);
        } catch (error: any) {
            message.error(error?.message || '头像上传失败，请稍后重试');
            onError?.(error as any);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveAvatar = async () => {
        if (!tempAvatarPath) {
            message.warning('请先上传头像');
            return;
        }

        setSaving(true);
        try {
            const res = await updateAvatar({ tempAvatarPath });
            const payload = ensureSuccess(res, '保存头像失败');
            const latestAvatar = payload?.avatar || tempAvatarPath;

            patchUserAvatar(String(latestAvatar));
            setTempAvatarPath('');
            setFileList([]);
            message.success('头像更新成功');
        } catch (error: any) {
            message.error(error?.message || '保存头像失败，请稍后重试');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="account-avatar-tab">
            <div className="account-avatar-layout">
                <div className="account-avatar-stage">
                    {displayAvatar ? (
                        <img src={displayAvatar} alt="头像预览" className="account-avatar-image" />
                    ) : (
                        <div className="account-avatar-empty">暂无头像</div>
                    )}
                </div>

                <div className="account-avatar-actions">
                    <Avatar size={104} src={displayAvatar || undefined} icon={<UserOutlined />} />
                    <p className="account-avatar-tip">请选择小于 5MB 的 jpg/png/webp 图片</p>
                    <Upload
                        fileList={fileList}
                        maxCount={1}
                        customRequest={customUpload}
                        beforeUpload={beforeUpload}
                        onChange={onUploadChange}
                        showUploadList={{ showPreviewIcon: false }}
                    >
                        <Button icon={<UploadOutlined />} loading={uploading}>
                            上传头像
                        </Button>
                    </Upload>
                    <Button type="primary" onClick={handleSaveAvatar} disabled={!tempAvatarPath} loading={saving}>
                        保存头像
                    </Button>
                </div>
            </div>
        </section>
    );
});

export default AvatarTabContent;
