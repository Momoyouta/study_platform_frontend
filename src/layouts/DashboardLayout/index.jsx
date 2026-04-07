import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Avatar, Layout, Menu, message, Grid, Button, Modal, Form, Input, Switch, Empty, Radio } from 'antd';
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
import UserProfileDropdown from '@/components/UserProfileDropdown.tsx';
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
  const currentSchoolId = Store.UserStore.schoolId;
  const hasBusinessSession = Store.UserStore.hasBusinessSession;
  const isCourseMenus = location.pathname === '/courseDetail' || location.pathname.startsWith('/courseDetail/');
  const userRole = Store.UserStore.role;
  const isCourseCreator = Store.CourseStore.isCourseCreator;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [isSwitchSchoolOpen, setIsSwitchSchoolOpen] = useState(false);
  const [switchSchoolLoading, setSwitchSchoolLoading] = useState(false);
  const [switchingSchool, setSwitchingSchool] = useState(false);
  const [selectedSchoolKey, setSelectedSchoolKey] = useState('');

  const schoolOptions = Store.UserStore.availableSchools;
  const currentActorType = Store.UserStore.actorType || (userRole === ROLE_MAP.TEACHER ? 1 : (userRole === ROLE_MAP.STUDENT ? 2 : null));

  const getSchoolId = (school) => String(school?.school_id || school?.schoolId || '');
  const getSchoolName = (school) => String(school?.school_name || school?.schoolName || school?.name || '');
  const getActorType = (school) => Number(school?.actor_type ?? school?.actorType);
  const getActorId = (school) => String(school?.actor_id || school?.actorId || '');
  const normalizeSchoolOptions = (options = []) => {
    return options
      .map((school) => {
        return {
          schoolId: getSchoolId(school),
          schoolName: getSchoolName(school),
          actorType: getActorType(school),
          actorId: getActorId(school),
        };
      })
      .filter((school) => {
        return !!school.schoolId && !!school.actorId && (school.actorType === 1 || school.actorType === 2);
      });
  };
  const normalizedSchoolOptions = normalizeSchoolOptions(schoolOptions || []);

  const toSchoolKey = (school) => `${getSchoolId(school)}_${getActorType(school)}_${getActorId(school)}`;

  useEffect(() => {
    if (!hasBusinessSession) {
      navigate('/login', { replace: true });
    }
  }, [navigate, hasBusinessSession]);

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
    return params.get('courseId') || Store.CourseStore.currentCourseId || '';
  }, [location.search]);

  const resolveMenuPath = (path) => {
    if (!isCourseMenus) return path;
    const basePath = path === '/' ? '/courseDetail/' : `/courseDetail${path}`;

    const params = new URLSearchParams(location.search);
    const next = new URLSearchParams();

    const nextCourseId = params.get('courseId') || Store.CourseStore.currentCourseId;
    const nextCreateId = params.get('createId') || Store.CourseStore.currentCreateId;
    const nextSchoolId = params.get('schoolId') || Store.CourseStore.currentSchoolId;
    const nextTeachingGroupId = params.get('teachingGroupId') || Store.CourseStore.currentTeachingGroupId;

    if (nextCourseId) {
      next.set('courseId', nextCourseId);
    }
    if (nextCreateId) {
      next.set('createId', nextCreateId);
    }
    if (nextSchoolId) {
      next.set('schoolId', nextSchoolId);
    }
    if (nextTeachingGroupId) {
      next.set('teachingGroupId', nextTeachingGroupId);
    }

    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
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
    Store.UserStore.clearAuth();
    resetStores();
    message.success('已退出登录');
    navigate('/login', { replace: true });
  };

  const openSwitchSchoolModal = async () => {
    setIsSwitchSchoolOpen(true);
    setSwitchSchoolLoading(true);
    try {
      await Store.UserStore.fetchAuthSchools();

      const latestSchoolOptions = normalizeSchoolOptions(Store.UserStore.availableSchools || []);
      const nextCurrentOption = latestSchoolOptions.find((school) => {
        if (getSchoolId(school) !== currentSchoolId) {
          return false;
        }
        if (!currentActorType) {
          return true;
        }
        return getActorType(school) === currentActorType;
      }) || null;

      if (nextCurrentOption) {
        setSelectedSchoolKey(toSchoolKey(nextCurrentOption));
      } else {
        setSelectedSchoolKey('');
      }
    } catch (error) {
      message.error(error?.message || '获取学校列表失败');
    } finally {
      setSwitchSchoolLoading(false);
    }
  };

  const handleSwitchSchoolConfirm = async () => {
    const targetSchool = normalizedSchoolOptions.find((school) => toSchoolKey(school) === selectedSchoolKey);
    if (!targetSchool) {
      message.warning('请先选择要切换的学校');
      return;
    }

    const targetSchoolId = getSchoolId(targetSchool);
    const targetActorType = getActorType(targetSchool);
    const targetSchoolName = getSchoolName(targetSchool);

    if (!targetSchoolId || (targetActorType !== 1 && targetActorType !== 2)) {
      message.error('学校数据不完整，请刷新学校列表后重试');
      return;
    }

    const isSameSchool = targetSchoolId === currentSchoolId && targetActorType === currentActorType;
    if (isSameSchool) {
      setIsSwitchSchoolOpen(false);
      return;
    }

    try {
      setSwitchingSchool(true);
      await Store.UserStore.switchSchool({
        schoolId: targetSchoolId,
        actorType: targetActorType,
      }, targetSchoolName);
      Store.CourseStore.reset();
      Store.CourseStore.currentSchoolId = Store.UserStore.schoolId || targetSchoolId;
      Store.HomeworkStore.reset();
      message.success('切换学校成功');
      setIsSwitchSchoolOpen(false);
      // window.location.href = '/';
    } catch (error) {
      message.error(error?.message || '切换学校失败，请稍后重试');
    } finally {
      setSwitchingSchool(false);
    }
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
        <UserProfileDropdown
          userName={userName}
          avatarSrc={userAvatarSrc}
          onAccount={() => navigate('/account')}
          onSwitchSchool={openSwitchSchoolModal}
          onLogout={handleLogout}
        />
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

      <Modal
        title="切换学校"
        open={isSwitchSchoolOpen}
        onCancel={() => setIsSwitchSchoolOpen(false)}
        onOk={handleSwitchSchoolConfirm}
        okText="确认切换"
        cancelText="取消"
        confirmLoading={switchingSchool}
        destroyOnClose
      >
        {switchSchoolLoading ? (
          <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            加载学校列表中...
          </div>
        ) : (
          <>
            {normalizedSchoolOptions.length > 0 ? (
              <Radio.Group
                style={{ width: '100%' }}
                value={selectedSchoolKey}
                onChange={(event) => setSelectedSchoolKey(event.target.value)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {normalizedSchoolOptions.map((school) => {
                    const key = toSchoolKey(school);
                    const checked = key === selectedSchoolKey;
                    const actorType = getActorType(school);
                    return (
                      <label
                        key={key}
                        style={{
                          border: checked ? '1px solid #1677ff' : '1px solid #e5eaf3',
                          borderRadius: 10,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <Radio value={key}>
                          <span style={{ fontWeight: 600, color: '#233248', marginRight:'16px' }}>{getSchoolName(school)}</span>
                          <span style={{ color: '#65758d', fontSize: 12 }}>
                            身份：{actorType === 1 ? '老师' : (actorType === 2 ? '学生' : '未知')}
                          </span>
                        </Radio>
                        
                      </label>
                    );
                  })}
                </div>
              </Radio.Group>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无可切换学校"
              />
            )}
          </>
        )}
      </Modal>
    </Layout>
  );
});

export default DashboardLayout;
