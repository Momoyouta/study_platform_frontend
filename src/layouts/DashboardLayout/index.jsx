import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Avatar, Dropdown, Layout, Menu, message, Grid, Button, Modal, Form, Input, Switch } from 'antd';
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
  EditOutlined,
} from '@ant-design/icons';
import { ROLE_MAP } from '@/type/map.js';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Store, { resetStores } from '@/store/index.ts';
import { buildFileViewUrl } from '@/utils/fileUrl.ts';
import { updateCourseBasicInfo } from '@/http/api.ts';
import TempImageUpload from '@/components/TempImageUpload.tsx';
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
  const isCourseCreator = Store.CourseStore.isCourseCreator;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleOpenEdit = () => {
    editForm.setFieldsValue({
      name: Store.CourseStore.courseName,
      status: Store.CourseStore.publishStatus === 1,
      cover_img: Store.CourseStore.courseCover
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (values) => {
    if (!courseId) {
      message.error('未找到当前课程');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        id: courseId,
        name: values.name,
        status: values.status ? 1 : 0,
        cover_img: values.cover_img
      };
      const res = await updateCourseBasicInfo(payload);
      if (res?.code === 200) {
        message.success('课程信息更新成功');
        setIsEditModalOpen(false);
        // 直接更新 CourseStore 的状态
        Store.CourseStore.courseName = payload.name;
        Store.CourseStore.publishStatus = payload.status;
        Store.CourseStore.courseCover = payload.cover_img || '';
      } else {
        message.error(res?.msg || '更新失败');
      }
    } catch (error) {
      console.error(error);
      message.error('更新失败');
    } finally {
      setSubmitting(false);
    }
  };

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

            {isCourseMenus && isCourseCreator && (
              <div style={{ padding: '0 8px', margin: '8px 0' }}>
                <Button
                  block
                  icon={<EditOutlined />}
                  color="purple"
                  variant="solid"
                  onClick={handleOpenEdit}
                  title="编辑课程基础信息"
                >
                  {!collapsed && '编辑课程基础信息'}
                </Button>
              </div>
            )}

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
                <span className='sidebar-goback' onClick={() => { navigate('/course'); }}>
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

      <Modal
        title="编辑课程基础信息"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={editForm} onFinish={handleEditSubmit} layout="vertical">
          <Form.Item name="name" label="课程标题" rules={[{ required: true, message: '请输入课程标题' }]}>
            <Input placeholder="请输入课程标题" />
          </Form.Item>
          <Form.Item name="status" label="发布状态" valuePropName="checked">
            <Switch checkedChildren="已发布" unCheckedChildren="未发布" />
          </Form.Item>
          <Form.Item name="cover_img" label="课程封面">
            <TempImageUpload
              variant="picture-card"
              onChange={(path) => editForm.setFieldValue('cover_img', path)}
              previewPath={editForm.getFieldValue('cover_img')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
});

export default DashboardLayout;
