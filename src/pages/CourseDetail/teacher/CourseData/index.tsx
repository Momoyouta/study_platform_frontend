import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Card, Pagination, Select, Space, Statistic, Typography } from 'antd';
import { getTeacherStatisticsCourseGroupProgress, getTeacherStatisticsLessonFunnel } from '@/http/api';
import { buildFileViewUrl } from '@/utils/fileUrl';
import type {
    LessonFunnelItemDto,
    TeacherCourseGroupProgressDto,
    TeacherCourseGroupProgressSortBy,
    TeacherCourseGroupProgressSortOrder,
} from '@/type/api';
import StatsCard from '@/components/Statistics/StatsCard';
import { LessonFunnelChart, LessonLearnCountBarChart } from '@/components/Statistics/charts';
import {
    createLatestRequestGuard,
    mergeStatisticsQueryParams,
    normalizeArrayData,
    normalizeNullableData,
    parseStatisticsErrorMessage,
    readStatisticsQueryParamsFromSearch,
} from '@/utils/statistics';
import { useLocation } from 'react-router-dom';
import './index.less';

const { Text } = Typography;

type CourseDataProps = {
    courseId: string | null;
    teachingGroupId?: string | null;
};

const CourseData = ({ courseId, teachingGroupId }: CourseDataProps) => {
    const location = useLocation();
    const requestGuardRef = useRef(createLatestRequestGuard());
    const groupProgressGuardRef = useRef(createLatestRequestGuard());

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lessonFunnelData, setLessonFunnelData] = useState<LessonFunnelItemDto[]>([]);

    const [groupProgressLoading, setGroupProgressLoading] = useState(false);
    const [groupProgressError, setGroupProgressError] = useState('');
    const [groupProgressData, setGroupProgressData] = useState<TeacherCourseGroupProgressDto | null>(null);
    const [groupPage, setGroupPage] = useState(1);
    const [groupPageSize, setGroupPageSize] = useState(10);
    const [groupSortBy, setGroupSortBy] = useState<TeacherCourseGroupProgressSortBy>('progressPercent');
    const [groupSortOrder, setGroupSortOrder] = useState<TeacherCourseGroupProgressSortOrder>('DESC');
    const [groupCompletedOnly, setGroupCompletedOnly] = useState<0 | 1>(0);

    const queryParams = useMemo(() => {
        const fromSearch = readStatisticsQueryParamsFromSearch(location.search);
        return mergeStatisticsQueryParams(fromSearch, {
            courseId: courseId || undefined,
            teachingGroupId: teachingGroupId || undefined,
        });
    }, [location.search, courseId, teachingGroupId]);

    useEffect(() => {
        if (!queryParams.courseId) {
            setLessonFunnelData([]);
            return;
        }

        const timer = window.setTimeout(async () => {
            const requestId = requestGuardRef.current.next();
            setLoading(true);
            setError('');

            try {
                const response = await getTeacherStatisticsLessonFunnel(queryParams);
                if (!requestGuardRef.current.isLatest(requestId)) {
                    return;
                }

                if (response?.code !== 200) {
                    setError(response?.msg || '获取课程运营分析失败');
                    setLessonFunnelData([]);
                    return;
                }

                setLessonFunnelData(normalizeArrayData<LessonFunnelItemDto>(response?.data));
            } catch (requestError) {
                if (!requestGuardRef.current.isLatest(requestId)) {
                    return;
                }

                setError(parseStatisticsErrorMessage(requestError, '获取课程运营分析失败'));
                setLessonFunnelData([]);
            } finally {
                if (requestGuardRef.current.isLatest(requestId)) {
                    setLoading(false);
                }
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
        };
    }, [queryParams]);

    const canLoadGroupProgress = !!queryParams.courseId && !!queryParams.teachingGroupId;

    useEffect(() => {
        if (!canLoadGroupProgress) {
            setGroupProgressData(null);
            setGroupProgressError('');
            return;
        }

        const timer = window.setTimeout(async () => {
            const requestId = groupProgressGuardRef.current.next();
            setGroupProgressLoading(true);
            setGroupProgressError('');

            try {
                const response = await getTeacherStatisticsCourseGroupProgress({
                    courseId: String(queryParams.courseId),
                    teachingGroupId: String(queryParams.teachingGroupId),
                    page: groupPage,
                    pageSize: groupPageSize,
                    sortBy: groupSortBy,
                    sortOrder: groupSortOrder,
                    completedOnly: groupCompletedOnly,
                    startTime: queryParams.startTime,
                    endTime: queryParams.endTime,
                });

                if (!groupProgressGuardRef.current.isLatest(requestId)) {
                    return;
                }

                if (response?.code !== 200) {
                    setGroupProgressError(response?.msg || '获取教学组学生进度失败');
                    setGroupProgressData(null);
                    return;
                }

                const normalizedData = normalizeNullableData<TeacherCourseGroupProgressDto | null>(response?.data, null);
                setGroupProgressData(normalizedData ? {
                    ...normalizedData,
                    list: normalizeArrayData(normalizedData.list),
                } : null);
            } catch (requestError) {
                if (!groupProgressGuardRef.current.isLatest(requestId)) {
                    return;
                }

                setGroupProgressError(parseStatisticsErrorMessage(requestError, '获取教学组学生进度失败'));
                setGroupProgressData(null);
            } finally {
                if (groupProgressGuardRef.current.isLatest(requestId)) {
                    setGroupProgressLoading(false);
                }
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
        };
    }, [
        canLoadGroupProgress,
        queryParams.courseId,
        queryParams.teachingGroupId,
        queryParams.startTime,
        queryParams.endTime,
        groupPage,
        groupPageSize,
        groupSortBy,
        groupSortOrder,
        groupCompletedOnly,
    ]);

    const groupProgressList = normalizeArrayData(groupProgressData?.list);

    return (
        <div className="teacher-course-data-page">
            <Card className="teacher-course-data-header" bordered={false}>
                <Space direction="vertical" size={2}>
                    <Text strong>课程运营分析</Text>
                </Space>
            </Card>

            <div className="teacher-course-data-grid">
                <StatsCard
                    title="课时平均观看进度"
                    loading={loading}
                    error={error}
                    empty={!loading && !error && lessonFunnelData.length === 0}
                    emptyDescription="暂无课时学习进度数据"
                >
                    <LessonFunnelChart data={lessonFunnelData} />
                </StatsCard>

                <StatsCard
                    title="学习频次排行"
                    loading={loading}
                    error={error}
                    empty={!loading && !error && lessonFunnelData.length === 0}
                    emptyDescription="暂无课时学习频次数据"
                >
                    <LessonLearnCountBarChart data={lessonFunnelData} />
                </StatsCard>

                <StatsCard
                    className="group-progress-card"
                    title="教学组学生课程进度"
                    loading={groupProgressLoading}
                    error={groupProgressError}
                    empty={!groupProgressLoading && !groupProgressError && (!canLoadGroupProgress || groupProgressList.length === 0)}
                    emptyDescription={canLoadGroupProgress ? '暂无学生课程进度数据' : '缺少教学组ID，无法查询教学组进度'}
                    extra={(
                        <Space wrap>
                            <Select
                                value={groupSortBy}
                                style={{ width: 140 }}
                                options={[
                                    { label: '按进度排序', value: 'progressPercent' },
                                    { label: '按姓名排序', value: 'studentName' },
                                ]}
                                onChange={(value: TeacherCourseGroupProgressSortBy) => {
                                    setGroupSortBy(value);
                                    setGroupPage(1);
                                }}
                            />
                            <Select
                                value={groupSortOrder}
                                style={{ width: 120 }}
                                options={[
                                    { label: '降序', value: 'DESC' },
                                    { label: '升序', value: 'ASC' },
                                ]}
                                onChange={(value: TeacherCourseGroupProgressSortOrder) => {
                                    setGroupSortOrder(value);
                                    setGroupPage(1);
                                }}
                            />
                            <Select
                                value={groupCompletedOnly}
                                style={{ width: 160 }}
                                options={[
                                    { label: '全部进度', value: 0 },
                                    { label: '仅 100% 完成', value: 1 },
                                ]}
                                onChange={(value: 0 | 1) => {
                                    setGroupCompletedOnly(value);
                                    setGroupPage(1);
                                }}
                            />
                        </Space>
                    )}
                >
                    <div className="group-progress-summary">
                        <Statistic title="教学组总人数" value={Number(groupProgressData?.totalStudents || 0)} suffix="人" />
                        <Statistic title="100%进度人数" value={Number(groupProgressData?.completedStudents || 0)} suffix="人" />
                        <Statistic title="当前筛选总数" value={Number(groupProgressData?.total || 0)} suffix="人" />
                    </div>

                    <div className="group-progress-grid">
                        {groupProgressList.map((student) => {
                            const avatarUrl = buildFileViewUrl(student.avatarPath || '');
                            const progressPercent = Math.max(0, Math.min(100, Math.round(Number(student.progressPercent || 0))));

                            return (
                                <div className="group-progress-item" key={student.studentId}>
                                    <Avatar
                                        size={56}
                                        src={avatarUrl || undefined}
                                        className="group-progress-avatar"
                                    >
                                        {String(student.studentName || student.studentId || '').slice(0, 1)}
                                    </Avatar>
                                    <div className="group-progress-name" title={student.studentName || student.studentId}>
                                        {student.studentName || student.studentId}
                                    </div>
                                    <div className="group-progress-percent">{progressPercent}%</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="group-progress-pagination">
                        <Pagination
                            current={groupPage}
                            pageSize={groupPageSize}
                            total={Number(groupProgressData?.total || 0)}
                            showSizeChanger
                            showTotal={(total) => `共 ${total} 人`}
                            onChange={(page, pageSize) => {
                                setGroupPage(page);
                                setGroupPageSize(pageSize);
                            }}
                        />
                    </div>
                </StatsCard>
            </div>
        </div>
    );
};

export default CourseData;