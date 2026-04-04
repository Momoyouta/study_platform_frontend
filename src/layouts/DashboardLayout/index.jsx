import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Avatar, Dropdown, Layout, Menu, message, Grid, Button } from 'antd';
import {
  AppstoreOutlined,
  BookOutlined,
  CheckSquareOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  PieChartOutlined,
  ReadOutlined,
  ScheduleOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ROLE_MAP } from '@/type/map.js';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Store, { resetStores } from '@/store/index.ts';
import { buildFileViewUrl } from '@/utils/fileUrl.ts';
import './index.less';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const sideMenusHome = [
  { key: 'home', label: '首页', path: '/', icon: <HomeOutlined /> },
  { key: 'course', label: '课程', path: '/course', icon: <BookOutlined /> },
  { key: 'resource-plaza', label: '资料广场', path: '/resource-plaza', icon: <AppstoreOutlined /> },
  { key: 'stats', label: '个人统计', path: '/stats', icon: <PieChartOutlined /> },
];

const sideMenusCourse = [
  { key: 'task', label: '任务', path: '/', icon: <CheckSquareOutlined /> },
  { key: 'chapter', label: '章节', path: '/chapter', icon: <ReadOutlined /> },
  { key: 'homework', label: '作业', path: '/homework', icon: <FileDoneOutlined /> },
  { key: 'materials', label: '资料', path: '/materials', icon: <FolderOpenOutlined /> },
  { key: 'studyRecord', label: '学习记录', path: '/studyRecord', icon: <ScheduleOutlined />, roles: [ROLE_MAP.STUDENT] },
  { key: 'teachingGroup', label: '教学组', path: '/teachingGroup', icon: <TeamOutlined />, roles: [ROLE_MAP.TEACHER] },
];

const DashboardLayout = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const userName = Store.UserStore.displayName || '未命名用户';
  const userAvatarSrc = Store.UserStore.avatar ? buildFileViewUrl(Store.UserStore.avatar) || undefined : undefined;
  const isCourseMenus = location.pathname === '/courseDetail' || location.pathname.startsWith('/courseDetail/');
  const userRole = Store.UserStore.role;

  const currentMenus = (isCourseMenus ? sideMenusCourse : sideMenusHome).filter((item) => {
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }
    return true;
  });

  const courseId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('courseId') || '';
  }, [location.search]);

  const resolveMenuPath = (path) => {
    if (!isCourseMenus) return path;
    const basePath = path === '/' ? '/courseDetail/' : `/courseDetail${path}`;
    if (!courseId) return basePath;
    return `${basePath}?courseId=${encodeURIComponent(courseId)}`;
  };

  const activeKey = useMemo(() => {
    if (isCourseMenus) {
      if (location.pathname === '/courseDetail' || location.pathname === '/courseDetail/') return 'task';
      if (location.pathname.startsWith('/courseDetail/chapter')) return 'chapter';
      if (location.pathname.startsWith('/courseDetail/homework')) return 'homework';
      if (location.pathname.startsWith('/courseDetail/materials')) return 'materials';
      if (location.pathname.startsWith('/courseDetail/studyRecord')) return 'studyRecord';
      if (location.pathname.startsWith('/courseDetail/teachingGroup')) return 'teachingGroup';
      return '';
    }

    if (location.pathname === '/') return 'home';
    if (location.pathname.startsWith('/course')) return 'course';
    if (location.pathname.startsWith('/resource-plaza')) return 'resource-plaza';
    if (location.pathname.startsWith('/stats')) return 'stats';
    return '';
  }, [isCourseMenus, location.pathname]);

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

  const menuItems = currentMenus.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  const collapsed = !screens.lg;

  return (
    <Layout className="dashboard-shell">
      <Header className="dashboard-topbar">
        <div className="school-title">{Store.UserStore.schoolName}</div>
        <Dropdown menu={profileMenu} trigger={['hover']} placement="bottomRight">
          <div className="user-anchor" role="button" tabIndex={0}>
            <Avatar className="user-anchor-avatar" src={userAvatarSrc} icon={<UserOutlined />} />
            <span className="user-anchor-name">{userName}</span>
          </div>
        </Dropdown>
      </Header>

      <Layout className="dashboard-body" style={{ '--dashboard-sider-width': `${collapsed ? 80 : 264}px` }}>
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
              key={isCourseMenus ? 'course-menu' : 'home-menu'}
              className="sidebar-menu-list sidebar-menu-switch"
              mode="inline"
              selectedKeys={activeKey ? [activeKey] : []}
              items={menuItems}
              inlineCollapsed={collapsed}
              onClick={({ key }) => {
                const target = currentMenus.find((item) => item.key === key);
                if (target) navigate(resolveMenuPath(target.path));
              }}
            />
            <div className="sidebar-footer">
              {isCourseMenus && (
                <span className='sidebar-goback' onClick={()=>{navigate('/course');}}>
                  {'←返回课程列表页'}
                </span>
              )}
            </div>
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
