import { Avatar, Dropdown } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './UserProfileDropdown.less';

type UserProfileDropdownProps = {
    userName?: string;
    avatarSrc?: string;
    className?: string;
    onAccount: () => void;
    onSwitchSchool?: () => void;
    onLogout: () => void;
};

const UserProfileDropdown = ({
    userName,
    avatarSrc,
    className,
    onAccount,
    onSwitchSchool,
    onLogout,
}: UserProfileDropdownProps) => {
    const menuItems: MenuProps['items'] = [
        { key: 'account', label: '账号管理' },
    ];

    if (onSwitchSchool) {
        menuItems.push({ key: 'switch-school', label: '切换学校' });
    }

    menuItems.push({ key: 'logout', label: '退出登录' });

    const menu: MenuProps = {
        items: menuItems,
        onClick: ({ key }) => {
            if (key === 'account') {
                onAccount();
                return;
            }

            if (key === 'switch-school') {
                onSwitchSchool?.();
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