import { IdcardOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import BasicProfileTabContent from './BasicProfileTabContent.tsx';
import AvatarTabContent from './AvatarTabContent.tsx';
import PasswordTabContent from './PasswordTabContent.tsx';
import SchoolSwitchTabContent from './SchoolSwitchTabContent.tsx';
import JoinSchoolTabContent from './JoinSchoolTabContent.tsx';
import './index.less';

const AccountManage = () => {
  const tabItems = [
    {
      key: 'basic',
      label: '基本资料',
      children: <BasicProfileTabContent />,
    },
    {
      key: 'avatar',
      label: '修改头像',
      children: <AvatarTabContent />,
    },
    {
      key: 'password',
      label: '密码管理',
      children: <PasswordTabContent />,
    },
    {
      key: 'school-switch',
      label: '切换学校',
      children: <SchoolSwitchTabContent />,
    },
    {
      key: 'school-join',
      label: '加入学校',
      children: <JoinSchoolTabContent />,
    },
  ];

  return (
    <section className="account-manage-panel">
      <header className="account-manage-header">
        <span className="account-manage-header-icon" aria-hidden>
          <IdcardOutlined />
        </span>
        <h2 className="account-manage-header-title">账号管理</h2>
      </header>

      <Tabs
        className="account-manage-tabs"
        defaultActiveKey="basic"
        size="large"
        items={tabItems}
        indicator={{ size: 42, align: 'center' }}
      />
    </section>
  );
};

export default AccountManage;
