import { Avatar, Dropdown } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './UserProfileDropdown.less';

type UserProfileDropdownProps = {
    userName?: string;
    avatarSrc?: string;
    className?: string;
    onAccount: () => void;
    onLogout: () => void;
};

const UserProfileDropdown = ({
    userName,
    avatarSrc,
    className,
    onAccount,
    onLogout,
}: UserProfileDropdownProps) => {
    const menu: MenuProps = {
        items: [
            { key: 'account', label: '账号管理' },
            { key: 'logout', label: '退出登录' },
        ],
        onClick: ({ key }) => {
            if (key === 'account') {
                onAccount();
                return;
            }
            onLogout();
        },
    };

    return (
        <Dropdown menu={menu} trigger={['hover']} placement="bottomRight">
            <div className={`user-profile-anchor ${className || ''}`.trim()} role="button" tabIndex={0}>
                <Avatar className="user-profile-avatar" src={avatarSrc} icon={<UserOutlined />} />
                <span className="user-profile-name">{userName || '未命名用户'}</span>
            </div>
        </Dropdown>
    );
};

export default UserProfileDropdown;