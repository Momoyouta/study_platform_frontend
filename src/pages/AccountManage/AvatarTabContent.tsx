import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Avatar, Button, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Store from '@/store/index';
import TempImageUpload from '@/components/TempImageUpload';
import { updateAvatar } from '@/http/api';
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
    const [tempAvatarPath, setTempAvatarPath] = useState('');
    const [saving, setSaving] = useState(false);

    const userStore = Store.UserStore;

    const displayAvatar = useMemo(() => {
        return buildFileViewUrl(tempAvatarPath || userStore.avatar);
    }, [tempAvatarPath, userStore.avatar]);

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
                    <TempImageUpload
                        buttonText="上传头像"
                        onChange={(path) => {
                            setTempAvatarPath(path);
                            if (path) {
                                message.success('头像上传成功，请点击“保存头像”生效');
                            }
                        }}
                    />
                    <Button type="primary" onClick={handleSaveAvatar} disabled={!tempAvatarPath} loading={saving}>
                        保存头像
                    </Button>
                </div>
            </div>
        </section>
    );
});

export default AvatarTabContent;
