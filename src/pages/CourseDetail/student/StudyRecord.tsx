import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, List, Space, Tag, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStudentStatisticsGradeHistory, getStudentStatisticsGroupLearningSummary } from '@/http/api';
import StatsCard from '@/components/Statistics/StatsCard';
import {
    createLatestRequestGuard,
    mergeStatisticsQueryParams,
    normalizeArrayData,
    parseStatisticsErrorMessage,
    readStatisticsQueryParamsFromSearch,
} from '@/utils/statistics';

import './StudyRecord.less';

const { Text } = Typography;

type StudyRecordProps = {
    courseId: string | null;
};

const StudyRecord = observer(({ courseId }: StudyRecordProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const requestGuardRef = useRef(createLatestRequestGuard());

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [gradeHistory, setGradeHistory] = useState<any[]>([]);
    const [groupSummary, setGroupSummary] = useState<any>(null);

    const statisticsQuery = useMemo(() => {
        const fromSearch = readStatisticsQueryParamsFromSearch(location.search);
        return mergeStatisticsQueryParams(fromSearch, {
            courseId: courseId || undefined,
        });
    }, [location.search, courseId]);

    useEffect(() => {
        if (!statisticsQuery.courseId) {
            setGradeHistory([]);
            setGroupSummary(null);
            return;
        }

        const timer = window.setTimeout(async () => {
            const requestId = requestGuardRef.current.next();
            setLoading(true);
            setError('');

            try {
                const [gradeResponse, summaryResponse] = await Promise.all([
                    getStudentStatisticsGradeHistory(statisticsQuery),
                    getStudentStatisticsGroupLearningSummary(statisticsQuery),
                ]);

                if (!requestGuardRef.current.isLatest(requestId)) {
                    return;
                }

                if (gradeResponse?.code !== 200 || summaryResponse?.code !== 200) {
                    setError(gradeResponse?.msg || summaryResponse?.msg || '获取学业档案失败');
                    setGradeHistory([]);
                    setGroupSummary(null);
                    return;
                }

                setGradeHistory(normalizeArrayData(gradeResponse?.data));
                setGroupSummary(summaryResponse?.data || null);
            } catch (requestError) {
                if (!requestGuardRef.current.isLatest(requestId)) {
                    return;
                }
                setError(parseStatisticsErrorMessage(requestError, '获取学业档案失败'));
                setGradeHistory([]);
                setGroupSummary(null);
            } finally {
                if (requestGuardRef.current.isLatest(requestId)) {
                    setLoading(false);
                }
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
        };
    }, [statisticsQuery]);



    return (
        <div className="study-record-container">
            <div className="study-record-grid">
                <StatsCard
                    title="个人学业档案"
                    loading={loading}
                    error={error}
                    empty={!loading && !error && gradeHistory.length === 0}
                    emptyDescription="暂无成绩记录"
                >
                    <List
                        dataSource={gradeHistory}
                        renderItem={(item) => {
                            return (
                                <List.Item className="study-record-item" key={item.assignmentId}>
                                    <div className="study-record-item-main">
                                        <Text strong>{item.title || '未命名作业'}</Text>
                                        <Space>
                                            <Tag color="blue">总分 {Number(item.totalScore || 0)}</Tag>
                                            <Text type="secondary">评语：{item.teacherComment || '暂无'}</Text>
                                        </Space>
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                </StatsCard>

                <StatsCard
                    title="教学组学习总结"
                    loading={loading}
                    error={error}
                    empty={!loading && !error && !groupSummary}
                    emptyDescription="暂无总结数据"
                >
                    {groupSummary && (
                        <div className="study-record-summary-content" style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                <div style={{ 
                                    width: 120, 
                                    height: 120, 
                                    borderRadius: '50%', 
                                    border: '6px solid #1890ff', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
                                }}>
                                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                                        {groupSummary.assignmentAvgScore ?? '-'}
                                    </span>
                                </div>
                                <Text type="secondary" strong style={{ fontSize: '16px' }}>作业平均分</Text>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                <div style={{ 
                                    width: 120, 
                                    height: 120, 
                                    borderRadius: '50%', 
                                    border: '6px solid #52c41a', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.15)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                                            {groupSummary.avgScoreRank ?? '-'}
                                        </span>
                                        {groupSummary.groupStudentCount && (
                                            <span style={{ fontSize: '18px', color: '#52c41a', marginLeft: '4px' }}>
                                                /{groupSummary.groupStudentCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Text type="secondary" strong style={{ fontSize: '16px' }}>平均分排名</Text>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                <div style={{ 
                                    width: 120, 
                                    height: 120, 
                                    borderRadius: '50%', 
                                    border: '6px solid #722ed1', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(114, 46, 209, 0.15)'
                                }}>
                                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#722ed1' }}>
                                        {groupSummary.courseLearnCount ?? '-'}
                                    </span>
                                </div>
                                <Text type="secondary" strong style={{ fontSize: '16px' }}>学习次数</Text>
                            </div>
                        </div>
                    )}
                </StatsCard>
            </div>
        </div>
    );
});

export default StudyRecord;
