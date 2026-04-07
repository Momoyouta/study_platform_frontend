import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Alert, Button, Form, Input, Space, Tag, Typography, message } from 'antd';
import Store from '@/store/index';
import { joinSchool } from '@/http/api';
import type { JoinSchoolResponse } from '@/type/api';
import type { AuthSchoolOptionDto } from '@/type/user';
import './JoinSchoolTabContent.less';

const { Text, Title } = Typography;

type JoinResult = JoinSchoolResponse & {
    schoolName?: string;
};

const actorTypeLabel = (actorType: number) => {
    return actorType === 1 ? '老师' : '学生';
};

const JoinSchoolTabContent = observer(() => {
    const [form] = Form.useForm();
    const [joining, setJoining] = useState(false);
    const [lastJoinResult, setLastJoinResult] = useState<JoinResult | null>(null);

    const getErrorMessage = (error: unknown, fallback: string) => {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return fallback;
    };

    const findSchoolName = (schoolId: string, actorType: number) => {
        const school = (Store.UserStore.availableSchools || []).find((item: AuthSchoolOptionDto) => {
            return item.school_id === schoolId && item.actor_type === actorType;
        });
        return school?.school_name || '';
    };

    const handleJoinSchool = async (values: { code: string }) => {
        try {
            setJoining(true);

            const res: any = await joinSchool({ code: values.code });
            if (res?.code !== undefined && res.code !== 0 && res.code !== 200) {
                throw new Error(res?.msg || '加入学校失败');
            }

            const joinData = (res?.data || null) as JoinSchoolResponse | null;
            if (!joinData) {
                throw new Error('加入学校失败：响应数据为空');
            }

            if (!joinData.joined) {
                message.warning('邀请码无效或已加入该学校');
                setLastJoinResult({ ...joinData });
                return;
            }

            try {
                await Store.UserStore.fetchAuthSchools();
            } catch (_error) {
                // 加入成功但刷新失败不阻断主流程
            }

            const schoolName = findSchoolName(joinData.school_id, joinData.actor_type);
            setLastJoinResult({ ...joinData, schoolName });
            message.success('加入学校成功');
            form.resetFields(['code']);
        } catch (error: unknown) {
            message.error(getErrorMessage(error, '加入学校失败，请稍后重试'));
        } finally {
            setJoining(false);
        }
    };

    return (
        <section className="account-join-school-tab">
            <Alert
                type="info"
                showIcon
                className="account-join-school-tip"
                message="通过邀请码加入学校"
                description="支持教师邀请码和学生邀请码。加入成功后，你可以在“切换学校”中切换到新身份。"
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleJoinSchool}
                className="account-join-school-form"
            >
                <Form.Item
                    label="学校邀请码"
                    name="code"
                    rules={[
                        { required: true, message: '请输入学校邀请码' },
                        { min: 4, message: '邀请码长度至少为 4 位' },
                    ]}
                >
                    <Input allowClear placeholder="请输入邀请码" />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={joining}>
                    加入学校
                </Button>
            </Form>

            {lastJoinResult && (
                <div className="account-join-school-result">
                    <Title level={5} style={{ marginTop: 0 }}>最近一次加入结果</Title>
                    <Space size={8} wrap>
                        <Tag color={lastJoinResult.joined ? 'green' : 'default'}>
                            {lastJoinResult.joined ? '加入成功' : '未加入'}
                        </Tag>
                        <Tag color={lastJoinResult.actor_type === 1 ? 'blue' : 'green'}>
                            {actorTypeLabel(lastJoinResult.actor_type)}
                        </Tag>
                    </Space>
                    <div className="account-join-school-meta">
                        <Text>学校ID：{lastJoinResult.school_id}</Text>
                        {lastJoinResult.schoolName ? <Text>学校名称：{lastJoinResult.schoolName}</Text> : null}
                        <Text>身份ID：{lastJoinResult.actor_id}</Text>
                    </div>
                </div>
            )}
        </section>
    );
});

export default JoinSchoolTabContent;
