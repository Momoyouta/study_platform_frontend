import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Avatar, Dropdown, Layout, Menu, message, Grid } from 'antd';
import { AppstoreOutlined, BookOutlined, HomeOutlined, PieChartOutlined, UserOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Store, { resetStores } from '@/store/index.ts';
import { buildFileViewUrl } from '@/utils/fileUrl.ts';
import './index.less';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const sideMenus = [
  { key: 'home', label: '首页', path: '/', icon: <HomeOutlined /> },
  { key: 'course', label: '课程', path: '/course', icon: <BookOutlined /> },
  { key: 'resource-plaza', label: '资料广场', path: '/resource-plaza', icon: <AppstoreOutlined /> },
  { key: 'stats', label: '个人统计', path: '/stats', icon: <PieChartOutlined /> },
];

const DashboardLayout = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const userName = Store.UserStore.displayName || '未命名用户';
  const userAvatarSrc = Store.UserStore.avatar ? buildFileViewUrl(Store.UserStore.avatar) || undefined : undefined;

  const activeKey = useMemo(() => {
    if (location.pathname === '/') return 'home';
    if (location.pathname.startsWith('/course')) return 'course';
    if (location.pathname.startsWith('/resource-plaza')) return 'resource-plaza';
    if (location.pathname.startsWith('/stats')) return 'stats';
    return '';
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    resetStores();
    message.success('已退出登录');
    navigate('/login', { replace: true });
  };

  const profileMenu = {
    items: [
      { key: 'account', label: '账号管理' },
      { key: 'logout', label: '退出登录' },
    ],
    onClick: ({ key }) => {
      if (key === 'account') {
        navigate('/account');
        return;
      }
      handleLogout();
    },
  };

  const menuItems = sideMenus.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  const collapsed = !screens.lg;

  return (
    <Layout className="dashboard-shell">
      <Header className="dashboard-topbar">
        <div className="school-title">学校名称</div>
        <Dropdown menu={profileMenu} trigger={['hover']} placement="bottomRight">
          <div className="user-anchor" role="button" tabIndex={0}>
            <Avatar className="user-anchor-avatar" src={userAvatarSrc} icon={<UserOutlined />} />
            <span className="user-anchor-name">{userName}</span>
          </div>
        </Dropdown>
      </Header>

      <Layout className="dashboard-body">
        <Sider
          className="dashboard-sidebar"
          width={264}
          collapsedWidth={80}
          collapsed={collapsed}
          trigger={null}
          breakpoint="lg"
        >
          <div className="dashboard-sidebar-inner">
            <div className="sidebar-user-card">
              <Avatar className="sidebar-user-avatar" size={64} src={userAvatarSrc} icon={<UserOutlined />} />
              {!collapsed && <div className="sidebar-user-name">{userName}</div>}
            </div>

            <Menu
              className="sidebar-menu-list"
              mode="inline"
              selectedKeys={activeKey ? [activeKey] : []}
              items={menuItems}
              inlineCollapsed={collapsed}
              onClick={({ key }) => {
                const target = sideMenus.find((item) => item.key === key);
                if (target) navigate(target.path);
              }}
            />
          </div>
        </Sider>

        <Content className="dashboard-main">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
});

export default DashboardLayout;
