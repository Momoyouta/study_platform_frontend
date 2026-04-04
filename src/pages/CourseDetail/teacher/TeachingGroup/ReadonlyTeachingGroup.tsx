import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Descriptions, Form, InputNumber, Modal, Select, Space, Tag, Typography, message } from 'antd';
import moment from 'moment';
import { useStore } from '@/store';
import { createCourseInvite, getMyTeachingGroupsInCourse } from '@/http/api';
import InviteCodeModal from '../components/InviteCodeModal';
import { CopyOutlined } from '@ant-design/icons';

import './ReadonlyTeachingGroup.less';

const { Text, Title } = Typography;

const parseUnixTimestamp = (value: any) => {
    if (value === undefined || value === null || value === '') return null;
    const numberValue = Number(value);
    if (Number.isFinite(numberValue) && numberValue > 0) {
        return numberValue > 9999999999 ? Math.floor(numberValue / 1000) : numberValue;
    }
    const parsedMs = Date.parse(String(value));
    return Number.isNaN(parsedMs) ? null : Math.floor(parsedMs / 1000);
};

const getInviteStatus = (record: any) => {
    // 优先使用新字段 invite_code | expire_time，保留旧字段兼容
    const code = record?.invite_code || record?.invitation_code || null;
    let expireUnix = parseUnixTimestamp(record?.expire_time);
    if (!expireUnix) {
        const createUnix = parseUnixTimestamp(record?.invitation_create_time);
        const ttlValue = Number(record?.invitation_ttl);
        const ttl = Number.isFinite(ttlValue) && ttlValue > 0 ? ttlValue : null;
        expireUnix = createUnix && ttl ? createUnix + ttl : null;
    }

    const nowUnix = Math.floor(Date.now() / 1000);
    const expired = !!expireUnix && nowUnix >= expireUnix;

    return {
        code,
        expireUnix,
        expired,
        // 只有在有 code 且未过期的情况下才算 valid
        status: !code ? 'none' : expired ? 'expired' : 'valid'
    };
};

type ReadonlyTeachingGroupProps = {
    courseId: string | null;
    schoolId?: string | null;
};

/**
 * 非课程创建者的教学组只读视图
 * - 展示自己所在教学组的基础信息（组名、成员老师）
 * - 可查看当前邀请码及有效期
 * - 可为自己所在的组生成新邀请码
 */
const ReadonlyTeachingGroup = ({ courseId, schoolId }: ReadonlyTeachingGroupProps) => {
    const { TeacherStore } = useStore();
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [inviteTarget, setInviteTarget] = useState<any>(null);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);

    const fetchGroups = useCallback(() => {
        if (!courseId) return;
        setLoading(true);
        getMyTeachingGroupsInCourse(courseId)
            .then((res: any) => {
                if (res?.code === 200) {
                    setGroups(Array.isArray(res.data) ? res.data : (res.data?.list || []));
                }
            })
            .catch((err: any) => {
                console.error('Failed to fetch my teaching groups', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [courseId]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
        message.success('已复制');
    };

    const openInviteModal = (group: any) => {
        setInviteTarget(group);
        setInviteModalOpen(true);
    };

    return (
        <div className="readonly-teaching-group">
            <Title level={5} className="group-title">我所在的教学组</Title>
            {loading ? (
                <Text type="secondary">加载中...</Text>
            ) : groups.length === 0 ? (
                <Text type="secondary">您当前未加入任何教学组</Text>
            ) : (
                groups.map((group) => {
                    const inviteMeta = getInviteStatus(group);
                    const teacherNames = Array.isArray(group?.teacher_names)
                        ? group.teacher_names.map((t: any) => typeof t === 'string' ? t : t.name || '未知老师').join('、')
                        : (Array.isArray(group?.teachers)
                            ? group.teachers.map((t: any) => t?.name || t).join('、')
                            : '-');

                    return (
                        <Card key={group.id} className="group-card" variant="outlined">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="教学组名称">{group.name}</Descriptions.Item>
                                <Descriptions.Item label="任课老师">{teacherNames}</Descriptions.Item>
                                <Descriptions.Item label="邀请码">
                                    <Space wrap>
                                        {inviteMeta.code && !inviteMeta.expired ? (
                                            <a
                                                className="invite-code-link"
                                                onClick={() => handleCopy(inviteMeta.code!)}
                                                title="点击复制"
                                            >
                                                <CopyOutlined />{inviteMeta.code}
                                            </a>
                                        ) : (
                                            <a onClick={() => openInviteModal(group)}>
                                                {inviteMeta.expired ? '重新生成邀请码' : '生成邀请码'}
                                            </a>
                                        )}

                                        {inviteMeta.expireUnix && (inviteMeta.code || inviteMeta.expired) && (
                                            <Text type="secondary" className="expire-time-text">
                                                至 {moment.unix(inviteMeta.expireUnix).format('YYYY-MM-DD HH:mm')}
                                            </Text>
                                        )}

                                        {inviteMeta.code && (
                                            <Tag color={inviteMeta.expired ? 'red' : 'green'}>
                                                {inviteMeta.expired ? '已失效' : '有效'}
                                            </Tag>
                                        )}
                                    </Space>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    );
                })
            )}

            <InviteCodeModal
                open={inviteModalOpen}
                courseId={courseId}
                schoolId={TeacherStore.schoolId || schoolId}
                targetGroup={inviteTarget}
                onCancel={() => {
                    setInviteModalOpen(false);
                    setInviteTarget(null);
                }}
                onSuccess={() => {
                    setInviteModalOpen(false);
                    setInviteTarget(null);
                    fetchGroups();
                }}
            />
        </div>
    );
};

export default ReadonlyTeachingGroup;
