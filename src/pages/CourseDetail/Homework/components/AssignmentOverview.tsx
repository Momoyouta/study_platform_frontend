import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Breadcrumb,
    Button,
    Card,
    Collapse,
    DatePicker,
    Descriptions,
    Empty,
    Form,
    Input,
    List,
    Modal,
    Pagination,
    Select,
    Space,
    Statistic,
    Tag,
    Typography,
    message,
} from 'antd';
import { CalendarOutlined, EditOutlined, LeftOutlined } from '@ant-design/icons';
import {
    extendTeacherAssignmentDeadline,
    getTeacherAssignmentDetail,
    getTeacherAssignmentStatistics,
    getTeacherStatisticsFillQuestionScoreRate,
    getTeacherStatisticsObjectiveQuestionAccuracy,
    getTeacherStatisticsScoreDistribution,
    getTeacherStatisticsShortAnswerScoreRate,
    getTeacherStatisticsSubmissionStatus,
    listTeacherAssignmentSubmissions,
    updateTeacherAssignment,
} from '@/http/api';
import StatsCard from '@/components/Statistics/StatsCard';
import { ScoreDistributionColumnChart } from '@/components/Statistics/charts';
import {
    createLatestRequestGuard,
    mergeStatisticsQueryParams,
    normalizeArrayData,
    normalizeNullableData,
    parseStatisticsErrorMessage,
    readStatisticsQueryParamsFromSearch,
} from '@/utils/statistics';
import type { HomeworkListItem } from '@/store/homework';
import type { QuestionAccuracyItemDto, QuestionScoreRateItemDto, ScoreDistributionDto, SubmissionStatusDto } from '@/type/api';

const { Text, Title } = Typography;

type AssignmentOverviewData = {
    assignment_id: string;
    title: string;
    start_time: string;
    deadline: string;
    display_status: string;
    total_score: number;
    total_question_count: number;
};

type AssignmentStatisticsData = {
    total_students: number;
    submitted_count: number;
    graded_count: number;
};

type AssignmentSubmissionItem = {
    id: string;
    submission_id?: string;
    assignment_id: string;
    student_id: string;
    student_name: string;
    status: number;
    total_score?: string | number | null;
    submit_time?: string | null;
    grade_time?: string | null;
};

type AssignmentOverviewProps = {
    assignmentId: string;
    courseId: string;
    teachingGroupId?: string;
    fallbackItem?: HomeworkListItem;
    onBackToList: () => void;
};

const STATUS_COLOR_MAP: Record<string, string> = {
    未发布: 'default',
    进行中: 'processing',
    已结束: 'default',
};

const SUBMISSION_GRADED_FILTER_OPTIONS = [
    { label: '全部', value: 'all' },
    { label: '已批改', value: 'graded' },
    { label: '待批改', value: 'pending' },
] as const;

const EMPTY_SUBMISSION_STATUS: SubmissionStatusDto = {
    unsubmitted: [],
    submittedPendingReview: [],
    reviewed: [],
};

const getSubmissionStatusMeta = (status: number) => {
    if (status === 2) {
        return { text: '已批改', color: 'success' as const };
    }

    if (status === 1) {
        return { text: '待批改', color: 'warning' as const };
    }

    return { text: '未知状态', color: 'default' as const };
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
    };
};

const buildTotalScoreFromQuestions = (questions: Array<Record<string, any>>) => {
    return (questions || []).reduce((sum, item) => {
        const score = Number(item?.score || 0);
        return sum + (Number.isNaN(score) ? 0 : score);
    }, 0);
};

const AssignmentOverview = ({ assignmentId, courseId, teachingGroupId, fallbackItem, onBackToList }: AssignmentOverviewProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const overviewGuardRef = useRef(createLatestRequestGuard());
    const analysisGuardRef = useRef(createLatestRequestGuard());
    const submissionGuardRef = useRef(createLatestRequestGuard());

    const [loading, setLoading] = useState(false);
    const [overview, setOverview] = useState<AssignmentOverviewData | null>(null);
    const [statistics, setStatistics] = useState<AssignmentStatisticsData | null>(null);

    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionDto | null>(null);
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatusDto>(EMPTY_SUBMISSION_STATUS);

    const [objectiveAccuracy, setObjectiveAccuracy] = useState<{ list: QuestionAccuracyItemDto[]; total: number; page: number }>({ list: [], total: 0, page: 1 });
    const [objectiveLoading, setObjectiveLoading] = useState(false);

    const [fillScoreRate, setFillScoreRate] = useState<{ list: QuestionScoreRateItemDto[]; total: number; page: number }>({ list: [], total: 0, page: 1 });
    const [fillLoading, setFillLoading] = useState(false);

    const [shortAnswerScoreRate, setShortAnswerScoreRate] = useState<{ list: QuestionScoreRateItemDto[]; total: number; page: number }>({ list: [], total: 0, page: 1 });
    const [shortAnswerLoading, setShortAnswerLoading] = useState(false);

    const fetchObjectiveAccuracy = async (page: number, refresh = false) => {
        if (!assignmentId || objectiveLoading) return;
        setObjectiveLoading(true);
        try {
            const res = await getTeacherStatisticsObjectiveQuestionAccuracy({
                ...statisticsQuery,
                page,
                pageSize: 10,
            });
            if (res.code === 200) {
                setObjectiveAccuracy((prev) => ({
                    list: refresh ? normalizeArrayData(res.data?.list) : [...prev.list, ...normalizeArrayData(res.data?.list)],
                    total: Number(res.data?.total || 0),
                    page: Number(res.data?.page || 1),
                }));
            }
        } catch (_error) {
            console.error('fetchObjectiveAccuracy error', _error);
        } finally {
            setObjectiveLoading(false);
        }
    };

    const fetchFillScoreRate = async (page: number, refresh = false) => {
        if (!assignmentId || fillLoading) return;
        setFillLoading(true);
        try {
            const res = await getTeacherStatisticsFillQuestionScoreRate({
                ...statisticsQuery,
                page,
                pageSize: 10,
            });
            if (res.code === 200) {
                setFillScoreRate((prev) => ({
                    list: refresh ? normalizeArrayData(res.data?.list) : [...prev.list, ...normalizeArrayData(res.data?.list)],
                    total: Number(res.data?.total || 0),
                    page: Number(res.data?.page || 1),
                }));
            }
        } catch (_error) {
            console.error('fetchFillScoreRate error', _error);
        } finally {
            setFillLoading(false);
        }
    };

    const fetchShortAnswerScoreRate = async (page: number, refresh = false) => {
        if (!assignmentId || shortAnswerLoading) return;
        setShortAnswerLoading(true);
        try {
            const res = await getTeacherStatisticsShortAnswerScoreRate({
                ...statisticsQuery,
                page,
                pageSize: 10,
            });
            if (res.code === 200) {
                setShortAnswerScoreRate((prev) => ({
                    list: refresh ? normalizeArrayData(res.data?.list) : [...prev.list, ...normalizeArrayData(res.data?.list)],
                    total: Number(res.data?.total || 0),
                    page: Number(res.data?.page || 1),
                }));
            }
        } catch (_error) {
            console.error('fetchShortAnswerScoreRate error', _error);
        } finally {
            setShortAnswerLoading(false);
        }
    };

    const [submissionSummary, setSubmissionSummary] = useState({ submitted: 0, graded: 0 });
    const [submissionList, setSubmissionList] = useState<AssignmentSubmissionItem[]>([]);
    const [submissionTotal, setSubmissionTotal] = useState(0);
    const [submissionLoading, setSubmissionLoading] = useState(false);
    const [submissionSearchInput, setSubmissionSearchInput] = useState('');
    const [submissionStudentName, setSubmissionStudentName] = useState('');
    const [submissionGradedFilter, setSubmissionGradedFilter] = useState<'all' | 'graded' | 'pending'>('all');
    const [submissionPage, setSubmissionPage] = useState(1);
    const [submissionPageSize, setSubmissionPageSize] = useState(10);

    const [titleModalOpen, setTitleModalOpen] = useState(false);
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [titleForm] = Form.useForm<{ title: string }>();

    const statisticsQuery = useMemo(() => {
        const fromSearch = readStatisticsQueryParamsFromSearch(location.search);
        return mergeStatisticsQueryParams(fromSearch, {
            courseId,
            teachingGroupId,
            assignmentId,
        });
    }, [location.search, courseId, teachingGroupId, assignmentId]);

    useEffect(() => {
        if (!assignmentId) {
            return;
        }

        const timer = window.setTimeout(async () => {
            const requestId = overviewGuardRef.current.next();
            setLoading(true);

            try {
                const [detailRes, statisticsRes]: any[] = await Promise.all([
                    getTeacherAssignmentDetail({ assignment_id: assignmentId }),
                    getTeacherAssignmentStatistics({
                        assignment_id: assignmentId,
                        ...(teachingGroupId ? { teaching_group_id: teachingGroupId } : {}),
                    }),
                ]);

                if (!overviewGuardRef.current.isLatest(requestId)) {
                    return;
                }

                const detailData = detailRes?.code === 200 ? detailRes.data : null;
                const statisticsData = statisticsRes?.code === 200 ? statisticsRes.data : null;

                setStatistics(statisticsData || null);
                setSubmissionSummary({
                    submitted: Number(statisticsData?.submitted_count || 0),
                    graded: Number(statisticsData?.graded_count || 0),
                });

                if (!detailData) {
                    setOverview(buildFallbackOverview(assignmentId, fallbackItem));
                    message.warning('作业详情接口返回异常，已展示最小回退数据');
                    return;
                }

                const totalScore = buildTotalScoreFromQuestions(Array.isArray(detailData.questions) ? detailData.questions : []);

                setOverview({
                    assignment_id: String(detailData.id || assignmentId),
                    title: String(detailData.title || ''),
                    start_time: String(detailData.start_time || ''),
                    deadline: String(detailData.deadline || ''),
                    display_status: getStatusText(Number(detailData.status || 0), String(detailData.start_time || ''), String(detailData.deadline || '')),
                    total_score: totalScore,
                    total_question_count: Number((detailData.questions || []).length || 0),
                });
            } catch (_error) {
                if (!overviewGuardRef.current.isLatest(requestId)) {
                    return;
                }

                setOverview(buildFallbackOverview(assignmentId, fallbackItem));
                setStatistics(null);
                setSubmissionSummary({ submitted: 0, graded: 0 });
            } finally {
                if (overviewGuardRef.current.isLatest(requestId)) {
                    setLoading(false);
                }
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
        };
    }, [assignmentId, teachingGroupId, fallbackItem?.endTime, fallbackItem?.isPublished, fallbackItem?.questionCount, fallbackItem?.startTime, fallbackItem?.title]);

    useEffect(() => {
        if (!assignmentId) {
            setScoreDistribution(null);
            setSubmissionStatus(EMPTY_SUBMISSION_STATUS);
            setObjectiveAccuracy({ list: [], total: 0, page: 1 });
            setFillScoreRate({ list: [], total: 0, page: 1 });
            setShortAnswerScoreRate({ list: [], total: 0, page: 1 });
            return;
        }

        const timer = window.setTimeout(async () => {
            const requestId = analysisGuardRef.current.next();
            setAnalysisLoading(true);
            setAnalysisError('');

            try {
                const [scoreRes, submissionStatusRes]: any[] = await Promise.all([
                    getTeacherStatisticsScoreDistribution(statisticsQuery),
                    getTeacherStatisticsSubmissionStatus(statisticsQuery),
                ]);

                if (!analysisGuardRef.current.isLatest(requestId)) {
                    return;
                }

                if (scoreRes?.code !== 200 || submissionStatusRes?.code !== 200) {
                    setAnalysisError(scoreRes?.msg || submissionStatusRes?.msg || '获取考情分析失败');
                    setScoreDistribution(null);
                    setSubmissionStatus(EMPTY_SUBMISSION_STATUS);
                    return;
                }

                const normalizedScoreDistribution = normalizeNullableData<ScoreDistributionDto | null>(scoreRes?.data, null);
                const normalizedSubmissionStatus = normalizeNullableData<SubmissionStatusDto>(submissionStatusRes?.data, EMPTY_SUBMISSION_STATUS);

                setScoreDistribution(normalizedScoreDistribution);
                setSubmissionStatus(normalizedSubmissionStatus);
                setSubmissionSummary({
                    submitted: Number(
                        normalizeArrayData(normalizedSubmissionStatus?.submittedPendingReview).length
                        + normalizeArrayData(normalizedSubmissionStatus?.reviewed).length,
                    ),
                    graded: Number(normalizeArrayData(normalizedSubmissionStatus?.reviewed).length),
                });

                // Fetch the three lists initial page
                fetchObjectiveAccuracy(1, true);
                fetchFillScoreRate(1, true);
                fetchShortAnswerScoreRate(1, true);
            } catch (requestError) {
                if (!analysisGuardRef.current.isLatest(requestId)) {
                    return;
                }

                setAnalysisError(parseStatisticsErrorMessage(requestError, '获取考情分析失败'));
                setScoreDistribution(null);
                setSubmissionStatus(EMPTY_SUBMISSION_STATUS);
            } finally {
                if (analysisGuardRef.current.isLatest(requestId)) {
                    setAnalysisLoading(false);
                }
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
        };
    }, [assignmentId, statisticsQuery]);

    useEffect(() => {
        if (!assignmentId) {
            setSubmissionList([]);
            setSubmissionTotal(0);
            return;
        }

        const timer = window.setTimeout(async () => {
            const requestId = submissionGuardRef.current.next();
            setSubmissionLoading(true);

            try {
                const isGraded = submissionGradedFilter === 'all' ? undefined : (submissionGradedFilter === 'graded' ? 1 : 0);

                const response: any = await listTeacherAssignmentSubmissions({
                    assignment_id: assignmentId,
                    ...(teachingGroupId ? { teaching_group_id: teachingGroupId } : {}),
                    ...(submissionStudentName ? { studentName: submissionStudentName } : {}),
                    ...(isGraded !== undefined ? { isGraded } : {}),
                    page: submissionPage,
                    pageSize: submissionPageSize,
                });

                if (!submissionGuardRef.current.isLatest(requestId)) {
                    return;
                }

                if (response?.code !== 200) {
                    setSubmissionList([]);
                    setSubmissionTotal(0);
                    return;
                }

                setSubmissionList(normalizeArrayData<AssignmentSubmissionItem>(response?.data?.list));
                setSubmissionTotal(Number(response?.data?.total || 0));
            } catch (_error) {
                if (!submissionGuardRef.current.isLatest(requestId)) {
                    return;
                }

                setSubmissionList([]);
                setSubmissionTotal(0);
            } finally {
                if (submissionGuardRef.current.isLatest(requestId)) {
                    setSubmissionLoading(false);
                }
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
        };
    }, [assignmentId, teachingGroupId, submissionStudentName, submissionGradedFilter, submissionPage, submissionPageSize]);

    useEffect(() => {
        if (!overview) {
            return;
        }
        titleForm.setFieldsValue({ title: overview.title });
    }, [overview?.title, titleForm]);

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
        const next = new URLSearchParams({
            courseId,
            assignmentId,
            questionNo: '1',
        });

        if (teachingGroupId) {
            next.set('teachingGroupId', teachingGroupId);
        }

        navigate(`/homeworkDetail?${next.toString()}`);
    };

    const goSubmissionReview = (submission: AssignmentSubmissionItem) => {
        const submissionId = String(submission.id || submission.submission_id || '');
        if (!submissionId) {
            message.warning('该提交记录缺少 submission_id，暂无法进入审批');
            return;
        }

        const assignmentTitle = String(overview?.title || fallbackItem?.title || '').trim();

        const next = new URLSearchParams({
            courseId,
            assignmentId,
            questionNo: '1',
            reviewMode: 'teacherApproval',
            submissionId,
        });

        if (teachingGroupId) {
            next.set('teachingGroupId', teachingGroupId);
        }
        if (submission.student_name) {
            next.set('studentName', submission.student_name);
        }
        if (assignmentTitle) {
            next.set('assignmentTitle', assignmentTitle);
        }

        navigate(`/homeworkDetail?${next.toString()}`);
    };

    if (!assignmentId) {
        return <Empty description="请选择作业" />;
    }

    const statusText = overview?.display_status || '未发布';

    const hasSubmissionStatusData = (
        submissionStatus.unsubmitted.length
        + submissionStatus.submittedPendingReview.length
        + submissionStatus.reviewed.length
    ) > 0;

    const submissionStatusBlocks = [
        { key: 'unsubmitted', title: '未提交', color: 'default' as const, list: submissionStatus.unsubmitted },
        { key: 'submittedPendingReview', title: '已提交待批改', color: 'warning' as const, list: submissionStatus.submittedPendingReview },
        { key: 'reviewed', title: '已批改', color: 'success' as const, list: submissionStatus.reviewed },
    ];

    return (
        <div className="assignment-overview-page">
            <div className="overview-page-toolbar" style={{ display: 'flex', alignItems: 'center' }}>
                <Button icon={<LeftOutlined />} onClick={onBackToList}>返回作业列表</Button>
                <Breadcrumb
                    style={{ marginLeft: '8px' }}
                    items={[{ title: '作业' }, { title: '概览' }]}
                />
            </div>

            <Card
                className="assignment-basic-card"
                loading={loading}
                title={(
                    <Space>
                        <Title level={4} style={{ margin: 0 }}>{overview?.title || '作业基本信息'}</Title>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            title="编辑作业标题"
                            onClick={() => setTitleModalOpen(true)}
                        />
                    </Space>
                )}
                extra={(
                    <Space>
                        <Button type="link" icon={<EditOutlined />} onClick={goHomeworkDetail}>编辑题目</Button>
                        <TooltipButton
                            title="修改开始结束时间"
                            icon={<CalendarOutlined />}
                            onClick={() => setTimeModalOpen(true)}
                        />
                    </Space>
                )}
            >
                <Descriptions className="assignment-basic-desc" column={4} size="small">
                    <Descriptions.Item label="作业名" span={2}>{overview?.title || '-'}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <Tag color={STATUS_COLOR_MAP[statusText] || 'default'}>{statusText}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="总题数">{overview?.total_question_count ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="作业开始" span={2}>{formatTimestamp(overview?.start_time || '')}</Descriptions.Item>
                    <Descriptions.Item label="截止时间" span={2}>{formatTimestamp(overview?.deadline || '')}</Descriptions.Item>
                </Descriptions>

                <div className="assignment-score-summary">
                    <Statistic title="总分" value={overview?.total_score ?? 0} suffix="分" />
                </div>
            </Card>

            <div className="overview-mock-panels">
                <Card title="作业提交统计" bordered={false}>
                    <Space size={24}>
                        <Statistic title="总人数" value={Number(statistics?.total_students || 0)} suffix="人" />
                        <Statistic title="已提交" value={Number(submissionSummary.submitted || 0)} suffix="人" />
                        <Statistic title="已批改" value={Number(submissionSummary.graded || 0)} suffix="人" />
                    </Space>
                </Card>
            </div>

            <div className="overview-analysis-panels">
                <StatsCard
                    title="成绩分布"
                    loading={analysisLoading}
                    error={analysisError}
                    empty={!analysisLoading && !analysisError && !(scoreDistribution?.buckets || []).length}
                    emptyDescription="暂无成绩分布数据"
                >
                    <div className="analysis-statistics-row">
                        <Statistic title="平均分" value={Number(scoreDistribution?.avgScore || 0)} precision={2} />
                        <Statistic title="最高分" value={Number(scoreDistribution?.maxScore || 0)} precision={2} />
                        <Statistic title="最低分" value={Number(scoreDistribution?.minScore || 0)} precision={2} />
                    </div>
                    <ScoreDistributionColumnChart data={scoreDistribution} />
                </StatsCard>

                <div className="accuracy-analysis-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                    <StatsCard
                        title="客观题正确率 (单/多/判)"
                        loading={objectiveLoading && objectiveAccuracy.list.length === 0}
                        error={analysisError}
                        empty={!objectiveLoading && objectiveAccuracy.list.length === 0}
                        emptyDescription="暂无客观题数据"
                        className="paged-analysis-card"
                    >
                        <div
                            className="paged-list-container"
                            style={{ height: '320px', overflowY: 'auto', paddingRight: '8px' }}
                            onScroll={(e: any) => {
                                const { scrollTop, scrollHeight, clientHeight } = e.target;
                                if (scrollHeight - scrollTop <= clientHeight + 20 && !objectiveLoading && objectiveAccuracy.list.length < objectiveAccuracy.total) {
                                    fetchObjectiveAccuracy(objectiveAccuracy.page + 1);
                                }
                            }}
                        >
                            <List
                                size="small"
                                dataSource={objectiveAccuracy.list}
                                renderItem={(item) => (
                                    <List.Item
                                        key={item.questionId}
                                        extra={<Text type="secondary">{Math.round((item.correctRate || 0) * 100)}%</Text>}
                                    >
                                        <List.Item.Meta
                                            title={<Text strong>第 {item.questionNo} 题</Text>}
                                        />
                                    </List.Item>
                                )}
                            />
                            {objectiveLoading && (
                                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                    加载中...
                                </div>
                            )}
                        </div>
                    </StatsCard>

                    <StatsCard
                        title="填空题得分率"
                        loading={fillLoading && fillScoreRate.list.length === 0}
                        error={analysisError}
                        empty={!fillLoading && fillScoreRate.list.length === 0}
                        emptyDescription="暂无填空题数据"
                        className="paged-analysis-card"
                    >
                        <div
                            className="paged-list-container"
                            style={{ height: '320px', overflowY: 'auto', paddingRight: '8px' }}
                            onScroll={(e: any) => {
                                const { scrollTop, scrollHeight, clientHeight } = e.target;
                                if (scrollHeight - scrollTop <= clientHeight + 20 && !fillLoading && fillScoreRate.list.length < fillScoreRate.total) {
                                    fetchFillScoreRate(fillScoreRate.page + 1);
                                }
                            }}
                        >
                            <List
                                size="small"
                                dataSource={fillScoreRate.list}
                                renderItem={(item) => (
                                    <List.Item
                                        key={item.questionId}
                                        extra={<Text type="secondary">{Math.round((item.scoreRate || 0) * 100)}%</Text>}
                                    >
                                        <List.Item.Meta
                                            title={<Text strong>第 {item.questionNo} 题</Text>}
                                        />
                                    </List.Item>
                                )}
                            />
                            {fillLoading && (
                                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                    加载中...
                                </div>
                            )}
                        </div>
                    </StatsCard>

                    <StatsCard
                        title="简答题得分率"
                        loading={shortAnswerLoading && shortAnswerScoreRate.list.length === 0}
                        error={analysisError}
                        empty={!shortAnswerLoading && shortAnswerScoreRate.list.length === 0}
                        emptyDescription="暂无简答题数据"
                        className="paged-analysis-card"
                    >
                        <div
                            className="paged-list-container"
                            style={{ height: '320px', overflowY: 'auto', paddingRight: '8px' }}
                            onScroll={(e: any) => {
                                const { scrollTop, scrollHeight, clientHeight } = e.target;
                                if (scrollHeight - scrollTop <= clientHeight + 20 && !shortAnswerLoading && shortAnswerScoreRate.list.length < shortAnswerScoreRate.total) {
                                    fetchShortAnswerScoreRate(shortAnswerScoreRate.page + 1);
                                }
                            }}
                        >
                            <List
                                size="small"
                                dataSource={shortAnswerScoreRate.list}
                                renderItem={(item) => (
                                    <List.Item
                                        key={item.questionId}
                                        extra={<Text type="secondary">{Math.round((item.scoreRate || 0) * 100)}%</Text>}
                                    >
                                        <List.Item.Meta
                                            title={<Text strong>第 {item.questionNo} 题</Text>}
                                        />
                                    </List.Item>
                                )}
                            />
                            {shortAnswerLoading && (
                                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                    加载中...
                                </div>
                            )}
                        </div>
                    </StatsCard>
                </div>

                <StatsCard
                    title="提交状态追踪"
                    loading={analysisLoading}
                    error={analysisError}
                    empty={!analysisLoading && !analysisError && !hasSubmissionStatusData}
                    emptyDescription="暂无提交状态数据"
                    className="submission-status-card"
                >
                    <div className="submission-status-columns">
                        {submissionStatusBlocks.map((block) => {
                            return (
                                <div className="submission-status-column" key={block.key}>
                                    <Space>
                                        <Text strong>{block.title}</Text>
                                        <Tag color={block.color}>{block.list.length} 人</Tag>
                                    </Space>
                                    <List
                                        size="small"
                                        dataSource={block.list.slice(0, 8)}
                                        locale={{ emptyText: '暂无' }}
                                        renderItem={(student) => (
                                            <List.Item className="submission-status-student-item" key={`${block.key}_${student.studentId}`}>
                                                <Text>{student.studentName || student.studentId}</Text>
                                            </List.Item>
                                        )}
                                    />
                                    {block.list.length > 8 ? <Text type="secondary">等 {block.list.length} 人</Text> : null}
                                </div>
                            );
                        })}
                    </div>
                </StatsCard>
            </div>

            <Collapse
                style={{ marginTop: '16px' }}
                items={[
                    {
                        key: 'submission-records',
                        label: '提交记录',
                        children: (
                            <div>
                                <Space wrap style={{ marginBottom: 12 }}>
                                    <Input.Search
                                        allowClear
                                        placeholder="按学生名前缀搜索"
                                        value={submissionSearchInput}
                                        style={{ width: 260 }}
                                        onChange={(event) => {
                                            const nextValue = event.target.value;
                                            setSubmissionSearchInput(nextValue);
                                            if (!nextValue.trim()) {
                                                setSubmissionStudentName('');
                                                setSubmissionPage(1);
                                            }
                                        }}
                                        onSearch={(value) => {
                                            setSubmissionStudentName(String(value || '').trim());
                                            setSubmissionPage(1);
                                        }}
                                    />
                                    <Select
                                        value={submissionGradedFilter}
                                        style={{ width: 160 }}
                                        options={[...SUBMISSION_GRADED_FILTER_OPTIONS]}
                                        onChange={(value) => {
                                            setSubmissionGradedFilter(value);
                                            setSubmissionPage(1);
                                        }}
                                    />
                                </Space>

                                <List
                                    loading={submissionLoading}
                                    dataSource={submissionList}
                                    locale={{ emptyText: '暂无提交记录' }}
                                    renderItem={(item) => {
                                        const statusMeta = getSubmissionStatusMeta(Number(item.status || 0));
                                        const submissionId = String(item.id || item.submission_id || '');
                                        const canReview = !!submissionId;

                                        return (
                                            <List.Item
                                                key={submissionId || `${item.student_id}_${item.submit_time || ''}`}
                                                className={`submission-record-item ${canReview ? 'clickable' : 'disabled'}`}
                                                onClick={() => {
                                                    if (!canReview) {
                                                        return;
                                                    }
                                                    goSubmissionReview(item);
                                                }}
                                                role={canReview ? 'button' : undefined}
                                                tabIndex={canReview ? 0 : -1}
                                                onKeyDown={(event) => {
                                                    if (!canReview) {
                                                        return;
                                                    }
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        goSubmissionReview(item);
                                                    }
                                                }}
                                            >
                                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                    <Space wrap>
                                                        <Text strong>{item.student_name || '-'}</Text>
                                                        <Tag color={statusMeta.color}>{statusMeta.text}</Tag>
                                                        <Text type="secondary">得分：{item.total_score ?? '-'}</Text>
                                                    </Space>
                                                    <Space wrap size={16}>
                                                        <Text type="secondary">提交时间：{formatTimestamp(String(item.submit_time || ''))}</Text>
                                                        <Text type="secondary">批改时间：{formatTimestamp(String(item.grade_time || ''))}</Text>
                                                    </Space>
                                                </Space>
                                            </List.Item>
                                        );
                                    }}
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                    <Pagination
                                        current={submissionPage}
                                        pageSize={submissionPageSize}
                                        total={submissionTotal}
                                        showSizeChanger
                                        showTotal={(total) => `共 ${total} 条`}
                                        onChange={(page, pageSize) => {
                                            setSubmissionPage(page);
                                            setSubmissionPageSize(pageSize);
                                        }}
                                    />
                                </div>
                            </div>
                        ),
                    },
                ]}
            />

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
                <DatePicker.RangePicker showTime style={{ width: '100%' }} onChange={handleTimeRangeChange} />
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
    return <Button type="text" title={title} icon={icon} onClick={onClick} />;
};

export default AssignmentOverview;
