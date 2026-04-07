import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Alert, Button, Empty, Space, Tag, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import Store from '@/store/index';
import { ROLE_MAP } from '@/type/map.js';
import { AuthSchoolOptionDto } from '@/type/user';
import './SchoolSwitchTabContent.less';

const SchoolSwitchTabContent = observer(() => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const schoolOptions: AuthSchoolOptionDto[] = Store.UserStore.availableSchools || [];
    const currentSchoolId = Store.UserStore.schoolId;
    const currentActorType = Store.UserStore.actorType || (Store.UserStore.role === ROLE_MAP.TEACHER ? 1 : (Store.UserStore.role === ROLE_MAP.STUDENT ? 2 : null));

    const getErrorMessage = (error: unknown, fallback: string) => {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return fallback;
    };

    const currentSchoolKey = useMemo(() => {
        const currentSchool = schoolOptions.find((school: AuthSchoolOptionDto) => {
            if (school.school_id !== currentSchoolId) {
                return false;
            }
            if (!currentActorType) {
                return true;
            }
            return school.actor_type === currentActorType;
        });

        if (!currentSchool) {
            return '';
        }

        return `${currentSchool.school_id}_${currentSchool.actor_type}_${currentSchool.actor_id}`;
    }, [schoolOptions, currentActorType, currentSchoolId]);

    useEffect(() => {
        if (schoolOptions.length > 0) {
            return;
        }

        const bootstrap = async () => {
            try {
                setRefreshing(true);
                await Store.UserStore.fetchAuthSchools();
            } catch (_error) {
                // 初始化失败由用户手动重试
            } finally {
                setRefreshing(false);
            }
        };

        bootstrap();
    }, [schoolOptions.length]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await Store.UserStore.fetchAuthSchools();
            message.success('学校列表已刷新');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, '获取学校列表失败'));
        } finally {
            setRefreshing(false);
        }
    };

    const handleSwitchSchool = async (school: any) => {
        const targetKey = `${school.school_id}_${school.actor_type}_${school.actor_id}`;
        if (targetKey === currentSchoolKey) {
            message.info('当前已在该学校身份下');
            return;
        }

        try {
            setLoading(true);
            await Store.UserStore.switchSchool({
                schoolId: school.school_id,
                actorType: school.actor_type,
            }, school.school_name);
            Store.CourseStore.reset();
            Store.CourseStore.currentSchoolId = Store.UserStore.schoolId || school.school_id;
            Store.HomeworkStore.reset();
            message.success('切换学校成功');
            window.location.href = '/';
        } catch (error: unknown) {
            message.error(getErrorMessage(error, '切换学校失败，请稍后重试'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="account-school-switch-tab">
            <Alert
                type="info"
                showIcon
                className="account-school-switch-tip"
                message="切换后将刷新当前业务上下文"
                description="切换学校会换发新的业务 Token，当前课程与作业页面数据将按新学校重新加载。"
            />

            <div className="account-school-switch-toolbar">
                <Button icon={<ReloadOutlined />} loading={refreshing} onClick={handleRefresh}>
                    刷新学校列表
                </Button>
            </div>

            {schoolOptions.length > 0 ? (
                <div className="account-school-switch-list">
                    {schoolOptions.map((school: AuthSchoolOptionDto) => {
                        const key = `${school.school_id}_${school.actor_type}_${school.actor_id}`;
                        const isCurrent = key === currentSchoolKey;
                        return (
                            <div className={`account-school-switch-item ${isCurrent ? 'current' : ''}`} key={key}>
                                <div className="account-school-switch-meta">
                                    <div className="account-school-switch-name">{school.school_name}</div>
                                    <Space size={8} wrap>
                                        <Tag color={school.actor_type === 1 ? 'blue' : 'green'}>
                                            {school.actor_type === 1 ? '老师' : '学生'}
                                        </Tag>
                                        <span className="account-school-switch-id">{school.school_id}</span>
                                        {isCurrent && <Tag color="gold">当前使用</Tag>}
                                    </Space>
                                </div>
                                <Button
                                    type={isCurrent ? 'default' : 'primary'}
                                    disabled={isCurrent}
                                    loading={loading}
                                    onClick={() => handleSwitchSchool(school)}
                                >
                                    {isCurrent ? '当前学校' : '切换到此学校'}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="account-school-switch-empty">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可用学校身份" />
                </div>
            )}
        </section>
    );
});

export default SchoolSwitchTabContent;
