import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Breadcrumb,
    Button,
    Card,
    DatePicker,
    Descriptions,
    Empty,
    Form,
    Input,
    Modal,
    Progress,
    Space,
    Statistic,
    Tag,
    Typography,
    message,
} from 'antd';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    CheckSquareOutlined,
    EditOutlined,
    FileTextOutlined,
    FormOutlined,
    LeftOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import {
    getTeacherAssignmentDetail,
    getTeacherAssignmentStatistics,
    listTeacherAssignmentSubmissions,
    extendTeacherAssignmentDeadline,
    updateTeacherAssignment,
} from '@/http/api';
import type { HomeworkListItem } from '@/store/homework';

const { Text, Title } = Typography;

type AssignmentTypeStat = {
    type: number;
    count: number;
    score: number;
    score_percentage: number;
    score_rate_avg: number;
};

type AssignmentOverviewData = {
    assignment_id: string;
    title: string;
    start_time: string;
    deadline: string;
    display_status: string;
    total_score: number;
    total_question_count: number;
    type_stats: AssignmentTypeStat[];
};

type AssignmentStatisticsData = {
    total_students: number;
    submitted_count: number;
    graded_count: number;
    questions: Array<{
        question_id: string;
        type: number;
        correct_rate: number | null;
        score_rate: number;
    }>;
};

type AssignmentOverviewProps = {
    assignmentId: string;
    courseId: string;
    fallbackItem?: HomeworkListItem;
    onBackToList: () => void;
};

const TYPE_META: Record<number, { title: string; subtitle?: string; icon: React.ReactNode; color: string }> = {
    1: { title: '单选题', icon: <CheckCircleOutlined />, color: '#1677ff' },
    2: { title: '多选题', icon: <CheckSquareOutlined />, color: '#3f8600' },
    3: { title: '判断题', icon: <QuestionCircleOutlined />, color: '#722ed1' },
    4: { title: '填空题', subtitle: '主观人工批改', icon: <FormOutlined />, color: '#d46b08' },
    5: { title: '简答题', subtitle: '主观人工批改', icon: <FileTextOutlined />, color: '#08979c' },
};

const STATUS_COLOR_MAP: Record<string, string> = {
    未发布: 'default',
    进行中: 'processing',
    已结束: 'default',
};

const getStatusText = (publishStatus: number, startTime: string, deadline: string) => {
    if (publishStatus !== 1) {
        return '未发布';
    }

    const start = Number(startTime);
    const end = Number(deadline);
    const now = Math.floor(Date.now() / 1000);

    if (Number.isNaN(start) || Number.isNaN(end)) {
        return '未发布';
    }
    if (now > end) {
        return '已结束';
    }
    return '进行中';
};

const formatTimestamp = (timestamp: string) => {
    const unixSeconds = Number(timestamp);
    if (!unixSeconds || Number.isNaN(unixSeconds)) {
        return '-';
    }

    const date = new Date(unixSeconds * 1000);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const toUnixFromDisplay = (displayTime: string) => {
    const raw = String(displayTime || '').trim();
    if (!raw) {
        return '';
    }

    const timestamp = Date.parse(raw.replace(/-/g, '/'));
    if (Number.isNaN(timestamp)) {
        return '';
    }

    return String(Math.floor(timestamp / 1000));
};

const buildFallbackOverview = (assignmentId: string, fallbackItem?: HomeworkListItem): AssignmentOverviewData => {
    const startUnix = fallbackItem?.startTimestamp || toUnixFromDisplay(fallbackItem?.startTime || '') || '1710000000';
    const endUnix = fallbackItem?.endTimestamp || toUnixFromDisplay(fallbackItem?.endTime || '') || '1710999999';

    return {
        assignment_id: assignmentId,
        title: fallbackItem?.title || '未命名作业',
        start_time: startUnix,
        deadline: endUnix,
        display_status: fallbackItem?.isPublished ? '进行中' : '未发布',
        total_score: 0,
        total_question_count: Number(fallbackItem?.questionCount || 0),
        type_stats: [1, 2, 3, 4, 5].map((type) => ({
            type,
            count: 0,
            score: 0,
            score_percentage: 0,
            score_rate_avg: 0,
        })),
    };
};

const buildTypeStatsByQuestions = (questions: Array<Record<string, any>>) => {
    const map = new Map<number, { count: number; score: number }>();

    questions.forEach((item) => {
        const type = Number(item.type || 0);
        if (type < 1 || type > 5) {
            return;
        }

        const prev = map.get(type) || { count: 0, score: 0 };
        const score = Number(item.score || 0);
        map.set(type, {
            count: prev.count + 1,
            score: prev.score + (Number.isNaN(score) ? 0 : score),
        });
    });

    const totalScore = Array.from(map.values()).reduce((sum, item) => sum + item.score, 0);

    return [1, 2, 3, 4, 5].map((type) => {
        const current = map.get(type) || { count: 0, score: 0 };
        return {
            type,
            count: current.count,
            score: current.score,
            score_percentage: totalScore <= 0 ? 0 : current.score / totalScore,
            score_rate_avg: 0,
        } as AssignmentTypeStat;
    });
};

const mergeScoreRateToTypeStats = (
    typeStats: AssignmentTypeStat[],
    statisticsQuestions: AssignmentStatisticsData['questions'],
) => {
    const scoreRateMap = new Map<number, number[]>();

    statisticsQuestions.forEach((item) => {
        const type = Number(item.type || 0);
        if (type < 1 || type > 5) {
            return;
        }

        const current = scoreRateMap.get(type) || [];
        current.push(Number(item.score_rate || 0));
        scoreRateMap.set(type, current);
    });

    return typeStats.map((item) => {
        const rates = scoreRateMap.get(item.type) || [];
        if (rates.length === 0) {
            return item;
        }

        const avg = rates.reduce((sum, num) => sum + num, 0) / rates.length;
        return {
            ...item,
            score_rate_avg: avg,
        };
    });
};

const AssignmentOverview = ({ assignmentId, courseId, fallbackItem, onBackToList }: AssignmentOverviewProps) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [overview, setOverview] = useState<AssignmentOverviewData | null>(null);
    const [statistics, setStatistics] = useState<AssignmentStatisticsData | null>(null);
    const [submissionsCount, setSubmissionsCount] = useState(0);
    const [titleModalOpen, setTitleModalOpen] = useState(false);
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [titleForm] = Form.useForm<{ title: string }>();

    useEffect(() => {
        if (!assignmentId) {
            return;
        }

        const fetchOverview = async () => {
            setLoading(true);

            try {
                const [detailRes, statisticsRes, submissionsRes]: any[] = await Promise.all([
                    getTeacherAssignmentDetail({ assignment_id: assignmentId }),
                    getTeacherAssignmentStatistics({ assignment_id: assignmentId }),
                    listTeacherAssignmentSubmissions({ assignment_id: assignmentId }),
                ]);

                const detailData = detailRes?.code === 200 ? detailRes.data : null;
                const statisticsData = statisticsRes?.code === 200 ? statisticsRes.data : null;
                const submissionsData = Array.isArray(submissionsRes?.data) ? submissionsRes.data : [];

                setStatistics(statisticsData || null);
                setSubmissionsCount(submissionsData.length);

                if (!detailData) {
                    setOverview(buildFallbackOverview(assignmentId, fallbackItem));
                    message.warning('作业详情接口返回异常，已展示最小回退数据');
                    return;
                }

                const baseTypeStats = buildTypeStatsByQuestions(Array.isArray(detailData.questions) ? detailData.questions : []);
                const mergedTypeStats = mergeScoreRateToTypeStats(baseTypeStats, statisticsData?.questions || []);
                const totalScore = mergedTypeStats.reduce((sum, item) => sum + item.score, 0);

                setOverview({
                    assignment_id: String(detailData.id || assignmentId),
                    title: String(detailData.title || ''),
                    start_time: String(detailData.start_time || ''),
                    deadline: String(detailData.deadline || ''),
                    display_status: getStatusText(Number(detailData.status || 0), String(detailData.start_time || ''), String(detailData.deadline || '')),
                    total_score: totalScore,
                    total_question_count: Number((detailData.questions || []).length || 0),
                    type_stats: mergedTypeStats,
                });
            } catch (_error) {
                setOverview(buildFallbackOverview(assignmentId, fallbackItem));
                setStatistics(null);
                setSubmissionsCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, [assignmentId, fallbackItem?.endTime, fallbackItem?.isPublished, fallbackItem?.questionCount, fallbackItem?.startTime, fallbackItem?.title]);

    useEffect(() => {
        if (!overview) {
            return;
        }
        titleForm.setFieldsValue({ title: overview.title });
    }, [overview?.title, titleForm]);

    const statusText = overview?.display_status || '未发布';

    const completionPercent = useMemo(() => {
        if (!statistics?.total_students) {
            return 0;
        }
        return Math.round((Number(statistics.submitted_count || 0) / Number(statistics.total_students || 1)) * 100);
    }, [statistics?.submitted_count, statistics?.total_students]);

    const handleSaveTitle = async () => {
        const values = await titleForm.validateFields();

        const title = String(values.title || '').trim();
        if (!title) {
            message.warning('请输入作业名');
            return;
        }

        const response: any = await updateTeacherAssignment({
            assignment_id: assignmentId,
            title,
        });

        if (response?.code !== 200) {
            message.warning(response?.msg || '作业名修改失败');
            return;
        }

        setOverview((prev) => {
            if (!prev) {
                return prev;
            }
            return {
                ...prev,
                title,
            };
        });
        setTitleModalOpen(false);
        message.success('作业名修改成功');
    };

    const handleTimeRangeChange = async (values: any) => {
        if (!values || !values[0] || !values[1] || !assignmentId) {
            return;
        }

        const startUnix = String(values[0].unix());
        const endUnix = String(values[1].unix());

        const response: any = await extendTeacherAssignmentDeadline({
            assignment_id: assignmentId,
            start_time: startUnix,
            deadline: endUnix,
        });

        if (response?.code !== 200) {
            message.warning(response?.msg || '时间修改失败');
            return;
        }

        setOverview((prev) => {
            if (!prev) {
                return prev;
            }
            return {
                ...prev,
                start_time: startUnix,
                deadline: endUnix,
                display_status: getStatusText(1, startUnix, endUnix),
            };
        });

        message.success('作业时间修改成功');
    };

    const goHomeworkDetail = () => {
        navigate(`/homeworkDetail?courseId=${courseId}&assignmentId=${assignmentId}&questionNo=1`);
    };

    if (!assignmentId) {
        return <Empty description="请选择作业" />;
    }

    return (
        <div className="assignment-overview-page">
            <div className="overview-page-toolbar" style={{ display: 'flex', alignItems: 'center' }}>
                <Button icon={<LeftOutlined />} onClick={onBackToList}>
                    返回作业列表
                </Button>
                <Breadcrumb
                    style={{ marginLeft: '8px' }}
                    items={[
                        { title: '作业' },
                        { title: '概览' },
                    ]}
                />
            </div>

            <Card
                className="assignment-basic-card"
                loading={loading}
                title={
                    <Space>
                        <Title level={4} style={{ margin: 0 }}>
                            {overview?.title || '作业基本信息'}
                        </Title>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            title="编辑作业标题"
                            onClick={() => setTitleModalOpen(true)}
                        />
                    </Space>
                }
                extra={
                    <Space>
                        <Button type="link" icon={<EditOutlined />} onClick={goHomeworkDetail}>
                            编辑题目
                        </Button>
                        <TooltipButton
                            title="修改开始结束时间"
                            icon={<CalendarOutlined />}
                            onClick={() => setTimeModalOpen(true)}
                        />
                    </Space>
                }
            >
                <Descriptions className="assignment-basic-desc" column={4} size="small">
                    <Descriptions.Item label="作业名" span={2}>
                        {overview?.title || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <Tag color={STATUS_COLOR_MAP[statusText] || 'default'}>{statusText}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="总题数">
                        {overview?.total_question_count ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="作业开始" span={2}>
                        {formatTimestamp(overview?.start_time || '')}
                    </Descriptions.Item>
                    <Descriptions.Item label="截止时间" span={2}>
                        {formatTimestamp(overview?.deadline || '')}
                    </Descriptions.Item>
                </Descriptions>

                <div className="assignment-score-summary">
                    <Statistic title="总分" value={overview?.total_score ?? 0} suffix="分" />
                </div>

                <div className="type-stats-grid">
                    {(overview?.type_stats || []).map((item) => {
                        const meta = TYPE_META[item.type];
                        const percent = Math.round((item.score_percentage || 0) * 100);
                        const scoreRateAvgPercent = Math.round((item.score_rate_avg || 0) * 100);

                        return (
                            <div className="type-stat-item" key={item.type}>
                                <div className="type-stat-header" style={{ color: meta.color }}>
                                    <span className="type-icon">{meta.icon}</span>
                                    <span>{meta.title}</span>
                                    {meta.subtitle && <Text type="secondary">（{meta.subtitle}）</Text>}
                                </div>
                                <div className="type-stat-body">
                                    <span>题数 {item.count}</span>
                                    <span>总分 {item.score}</span>
                                </div>
                                <Progress percent={percent} size="small" strokeColor={meta.color} />
                                <Text type="secondary">题型平均得分率：{scoreRateAvgPercent}%</Text>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <div className="overview-mock-panels">
                <Card title="作业提交统计" bordered={false}>
                    <Space size={24}>
                        <Statistic title="总人数" value={Number(statistics?.total_students || 0)} suffix="人" />
                        <Statistic title="已提交" value={Number(statistics?.submitted_count || 0)} suffix="人" />
                        <Statistic title="已批改" value={Number(statistics?.graded_count || 0)} suffix="人" />
                    </Space>
                </Card>

                <Card title="提交进度概览" bordered={false}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Statistic title="提交记录数" value={submissionsCount} suffix="条" />
                        <Progress percent={completionPercent} />
                        <Text type="secondary">提交进度按统计接口 total_students/submitted_count 计算</Text>
                    </Space>
                </Card>
            </div>

            <Modal
                title="编辑作业名"
                open={titleModalOpen}
                onCancel={() => setTitleModalOpen(false)}
                onOk={handleSaveTitle}
                okText="保存"
                cancelText="取消"
                destroyOnClose
            >
                <Form form={titleForm} layout="vertical">
                    <Form.Item
                        name="title"
                        label="作业名"
                        rules={[{ required: true, message: '请输入作业名' }]}
                    >
                        <Input maxLength={64} placeholder="请输入作业名" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="修改开始结束时间"
                open={timeModalOpen}
                onCancel={() => setTimeModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <DatePicker.RangePicker
                    showTime
                    style={{ width: '100%' }}
                    onChange={handleTimeRangeChange}
                />
                <div className="time-edit-tip">修改后将调用教师端时间调整接口并即时刷新本地展示。</div>
            </Modal>
        </div>
    );
};

const TooltipButton = ({
    title,
    icon,
    onClick,
}: {
    title: string;
    icon: React.ReactNode;
    onClick: () => void;
}) => {
    return (
        <Button type="text" title={title} icon={icon} onClick={onClick} />
    );
};

export default AssignmentOverview;
