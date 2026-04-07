import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Button,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    message,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import moment from 'moment';
import { useStore } from '@/store';
import {
    bindTeachingGroupTeachers,
    createTeachingGroup,
    deleteTeachingGroup,
    getTeachingGroup,
    listTeachingGroup,
    querySchoolTeacherByName,
    updateTeachingGroup,
} from '@/http/api';
import InviteCodeModal from '../components/InviteCodeModal';
import './index.less';

const isSuccessResponse = (res) => res?.code === 200 || res?.success || !!res?.data;

const parseUnixTimestamp = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const numberValue = Number(value);
    if (Number.isFinite(numberValue) && numberValue > 0) {
        return numberValue > 9999999999 ? Math.floor(numberValue / 1000) : numberValue;
    }

    const parsedMs = Date.parse(String(value));
    if (Number.isNaN(parsedMs)) {
        return null;
    }

    return Math.floor(parsedMs / 1000);
};

const getTeachersFromRecord = (record) => {
    if (!Array.isArray(record?.teachers)) {
        return [];
    }

    return record.teachers
        .map((item) => {
            if (typeof item === 'string') {
                const name = item.trim();
                if (!name) {
                    return null;
                }
                return { id: '', name };
            }

            const id = item?.id ?? item?.teacher_id ?? item?.user_id;
            const name = item?.name ?? item?.teacher_name ?? item?.user_name;
            if (!id && !name) {
                return null;
            }
            return {
                id: id ? String(id) : '',
                name: name ? String(name) : '',
            };
        })
        .filter(Boolean);
};

const getTeacherNameText = (record) => {
    const teachers = getTeachersFromRecord(record);
    if (teachers.length) {
        return teachers
            .map((item) => item.name || item.id)
            .filter((value) => !!value)
            .join('、');
    }
    if (Array.isArray(record?.teacher_names) && record.teacher_names.length) {
        return record.teacher_names
            .map((t) => (typeof t === 'string' ? t : t.name || '未知老师'))
            .join('、');
    }

    return '-';
};

const getTeacherSelection = (record) => {
    const teachers = getTeachersFromRecord(record);
    if (teachers.length) {
        return {
            teacherIds: teachers.map((item) => item.id).filter((id) => !!id),
            teacherNames: teachers.map((item) => item.name || item.id),
        };
    }

    const teacherIds = Array.isArray(record?.teacher_ids)
        ? record.teacher_ids.map((id) => String(id)).filter((id) => !!id)
        : [];
    const teacherNames = Array.isArray(record?.teacher_names)
        ? record.teacher_names
        : [];

    return { teacherIds, teacherNames };
};

const getInviteMeta = (record) => {
    const code = record?.invite_code || record?.invitation_code || null;
    let expireUnix = parseUnixTimestamp(record?.expire_time);
    if (!expireUnix) {
        const createUnix = parseUnixTimestamp(record?.invitation_create_time);
        const ttlValue = Number(record?.invitation_ttl);
        const ttl = Number.isFinite(ttlValue) && ttlValue > 0 ? ttlValue : null;
        expireUnix = createUnix && ttl ? createUnix + ttl : null;
    }
    
    const ttl = Number(record?.invitation_ttl) || 0;
    const nowUnix = Math.floor(Date.now() / 1000);
    const expired = !!expireUnix && nowUnix >= expireUnix;

    let status = 'unknown';
    if (!code) {
        status = 'none';
    } else if (expireUnix) {
        status = expired ? 'expired' : 'valid';
    }

    return { code, ttl, expireUnix, status, expired };
};

// 移除了冗余的 convertSecondsToUnitValue 函数，已整合进 InviteCodeModal

const normalizeSearchParams = (params) => {
    const nextParams = { ...params };
    Object.keys(nextParams).forEach((key) => {
        if (nextParams[key] === undefined || nextParams[key] === null || nextParams[key] === '') {
            delete nextParams[key];
        }
    });
    return nextParams;
};

const TeachingGroupManage = ({ courseId, schoolId }) => {
    const [searchForm] = Form.useForm();
    const [groupForm] = Form.useForm();
    const { TeacherStore, CourseStore } = useStore();

    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [groupSaving, setGroupSaving] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteTarget, setInviteTarget] = useState(null);

    const [teacherOptions, setTeacherOptions] = useState([]);
    const [teacherFetching, setTeacherFetching] = useState(false);
    const teacherQueryRequestRef = useRef(0);

    // 使用本项目的 TeacherStore 取 schoolId
    const currentSchoolId = useMemo(() => {
        return TeacherStore.schoolId || schoolId;
    }, [TeacherStore.schoolId, schoolId]);

    const appendTeacherOptions = useCallback((optionItems) => {
        if (!Array.isArray(optionItems) || !optionItems.length) {
            return;
        }
        setTeacherOptions((prevOptions) => {
            const optionMap = new Map();
            prevOptions.forEach((item) => {
                optionMap.set(String(item.value), item);
            });
            optionItems.forEach((item) => {
                optionMap.set(String(item.value), item);
            });
            return Array.from(optionMap.values());
        });
    }, []);

    const appendTeacherOptionsBySelection = useCallback((teacherIds, teacherNames = []) => {
        if (!Array.isArray(teacherIds) || !teacherIds.length) {
            return;
        }
        const options = teacherIds
            .filter((teacherId) => !!teacherId)
            .map((teacherId, index) => ({
                value: String(teacherId),
                label: teacherNames[index] || `教师${index + 1}`,
            }));
        appendTeacherOptions(options);
    }, [appendTeacherOptions]);

    const fetchList = useCallback(async (pageParams, searchValues) => {
        if (!courseId) {
            return;
        }

        const params = normalizeSearchParams({
            course_id: String(courseId),
            page: pageParams.current,
            pageSize: pageParams.pageSize,
            name: (searchValues?.name || '').trim(),
        });

        setLoading(true);
        listTeachingGroup(params)
            .then((res) => {
                if (!isSuccessResponse(res)) {
                    message.error(res?.msg || '获取教学组列表失败');
                    return;
                }

                const keyword = (searchValues?.name || '').trim();
                const rawList = res?.data?.list || [];
                const list = keyword
                    ? rawList.filter((item) => String(item?.name || '').includes(keyword))
                    : rawList;
                const totalFromApi = Number(res?.data?.total);
                const total = keyword && Number.isFinite(totalFromApi) && totalFromApi === rawList.length
                    ? list.length
                    : (Number.isFinite(totalFromApi) ? totalFromApi : list.length);

                setTableData(list);
                CourseStore.setTeachingGroups(list);
                setPagination((prev) => ({
                    ...prev,
                    current: pageParams.current,
                    pageSize: pageParams.pageSize,
                    total,
                }));
            })
            .catch((error) => {
                console.error('Failed to fetch teaching groups', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [courseId]);

    useEffect(() => {
        if (!courseId) {
            return;
        }
        fetchList({ current: 1, pageSize: pagination.pageSize }, {});
    }, [courseId, fetchList, pagination.pageSize]);

    const queryTeachersByName = useCallback(async (keyword) => {
        const trimmedKeyword = keyword.trim();
        if (!trimmedKeyword || !currentSchoolId) {
            return;
        }

        const requestId = ++teacherQueryRequestRef.current;
        setTeacherFetching(true);
        querySchoolTeacherByName({
            school_id: currentSchoolId,
            name: trimmedKeyword,
            page: 1,
            pageSize: 20,
        })
            .then((res) => {
                if (requestId !== teacherQueryRequestRef.current) {
                    return;
                }

                if (!isSuccessResponse(res)) {
                    message.error(res?.msg || '查询老师失败');
                    return;
                }

                const fetchedOptions = (res?.data?.list || []).map((teacher) => ({
                    value: String(teacher.id),
                    label: teacher.name,
                }));
                appendTeacherOptions(fetchedOptions);
            })
            .catch((error) => {
                console.error('Failed to query school teachers', error);
            })
            .finally(() => {
                if (requestId === teacherQueryRequestRef.current) {
                    setTeacherFetching(false);
                }
            });
    }, [appendTeacherOptions, currentSchoolId]);

    const debouncedTeacherSearch = useMemo(
        () => debounce((keyword) => queryTeachersByName(keyword), 400),
        [queryTeachersByName]
    );

    useEffect(() => {
        return () => debouncedTeacherSearch.cancel();
    }, [debouncedTeacherSearch]);

    const refreshList = () => {
        fetchList(
            { current: pagination.current, pageSize: pagination.pageSize },
            searchForm.getFieldsValue()
        );
    };

    const onSearch = (values) => {
        fetchList(
            { current: 1, pageSize: pagination.pageSize },
            values
        );
    };

    const onReset = () => {
        searchForm.resetFields();
        fetchList({ current: 1, pageSize: pagination.pageSize }, {});
    };

    const handleTableChange = (nextPagination) => {
        fetchList(
            {
                current: nextPagination.current,
                pageSize: nextPagination.pageSize,
            },
            searchForm.getFieldsValue()
        );
    };

    const openCreateModal = () => {
        setEditingGroup(null);
        setTeacherOptions([]);
        groupForm.resetFields();
        groupForm.setFieldsValue({
            name: undefined,
            teacher_ids: [],
        });
        setGroupModalOpen(true);
    };

    const openEditModal = (record) => {
        setEditingGroup(record);

        const { teacherIds, teacherNames } = getTeacherSelection(record);

        groupForm.setFieldsValue({
            name: record?.name,
            teacher_ids: teacherIds,
        });
        appendTeacherOptionsBySelection(teacherIds, teacherNames);
        setGroupModalOpen(true);
    };

    const handleSaveGroup = async () => {
        try {
            const values = await groupForm.validateFields();
            if (!courseId) {
                message.error('课程ID缺失，无法保存教学组');
                return;
            }

            setGroupSaving(true);
            let teachingGroupId = editingGroup?.id;

            if (editingGroup) {
                const updateRes = await updateTeachingGroup({
                    teaching_group_id: String(editingGroup.id),
                    name: values.name,
                });
                if (!isSuccessResponse(updateRes)) {
                    message.error(updateRes?.msg || '教学组更新失败');
                    return;
                }
            } else {
                const createRes = await createTeachingGroup({
                    course_id: String(courseId),
                    name: values.name,
                });
                if (!isSuccessResponse(createRes)) {
                    message.error(createRes?.msg || '教学组创建失败');
                    return;
                }
                teachingGroupId = createRes?.data?.id;
            }

            const teacherIds = Array.isArray(values.teacher_ids)
                ? values.teacher_ids.map((id) => String(id)).filter((id) => !!id)
                : [];

            if (teachingGroupId && teacherIds.length) {
                const bindRes = await bindTeachingGroupTeachers({
                    course_id: String(courseId),
                    teaching_group_id: String(teachingGroupId),
                    teacher_ids: teacherIds,
                });
                if (!isSuccessResponse(bindRes) && !bindRes?.data?.updated) {
                    message.warning(bindRes?.msg || '教学组已保存，但老师绑定失败');
                }
            }

            message.success(editingGroup ? '教学组更新成功' : '教学组创建成功');
            setGroupModalOpen(false);
            groupForm.resetFields();
            setTeacherOptions([]);
            refreshList();
        } catch (error) {
            if (error?.errorFields) {
                return;
            }
            console.error('Failed to save teaching group', error);
        } finally {
            setGroupSaving(false);
        }
    };

    const handleDeleteGroup = (record) => {
        Modal.confirm({
            title: '确认删除教学组',
            content: `确定删除教学组「${record.name}」吗？`,
            okText: '删除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: () => {
                return deleteTeachingGroup(String(record.id))
                    .then((res) => {
                        if (!isSuccessResponse(res)) {
                            message.error(res?.msg || '教学组删除失败');
                            return;
                        }

                        message.success('教学组删除成功');
                        const nextCurrent = tableData.length === 1 && pagination.current > 1
                            ? pagination.current - 1
                            : pagination.current;
                        fetchList(
                            { current: nextCurrent, pageSize: pagination.pageSize },
                            searchForm.getFieldsValue()
                        );
                    })
                    .catch((error) => {
                        console.error('Failed to delete teaching group', error);
                    });
            },
        });
    };

    const openInviteModal = (record) => {
        setInviteTarget(record);
        setInviteModalOpen(true);
    };

    const handleCopy = (value) => {
        navigator.clipboard.writeText(value);
        message.success('已复制');
    };

    const columns = [
        {
            title: '教学组ID',
            dataIndex: 'id',
            key: 'id',
            width: 130,
            ellipsis: true,
            render: (value) => (
                <a style={{ width: '120px', textOverflow: 'ellipsis', overflow: 'hidden', display: 'inline-block' }}
                    onClick={() => handleCopy(value)}
                >
                    {value}
                </a>
            ),
        },
        {
            title: '教学组名',
            dataIndex: 'name',
            key: 'name',
            width: 180,
            ellipsis: true,
        },
        {
            title: '组员',
            key: 'teachers',
            width: 260,
            render: (_, record) => (
                <span className="teacher-name-cell">{getTeacherNameText(record)}</span>
            ),
        },
        {
            title: '邀请码',
            key: 'invitation_code',
            width: 170,
            render: (_, record) => {
                const inviteMeta = getInviteMeta(record);
                const canCreateInvite = !inviteMeta.code || inviteMeta.expired;
                const inviteActionText = inviteMeta.expired ? '重新生成邀请码' : '生成邀请码';

                if (!inviteMeta.code) {
                    return (
                        <Button
                            type="link"
                            className="inline-link-button"
                            onClick={() => openInviteModal(record)}
                        >
                            {inviteActionText}
                        </Button>
                    );
                }

                return (
                    <Space direction="vertical" size={0}>
                        {!inviteMeta.expired &&
                          <a style={{ width: '120px', textOverflow: 'ellipsis', overflow: 'hidden', display: 'inline-block', textWrap: 'nowrap' }}
                              onClick={() => handleCopy(inviteMeta.code)}
                          >
                              {inviteMeta.code}
                          </a>}
                        {canCreateInvite && (
                            <Button
                                type="link"
                                className="inline-link-button"
                                onClick={() => openInviteModal(record)}
                            >
                                {inviteActionText}
                            </Button>
                        )}
                    </Space>
                );
            },
        },
        {
            title: '截止日期',
            key: 'invite_deadline',
            width: 260,
            render: (_, record) => {
                const inviteMeta = getInviteMeta(record);

                let color = 'default';
                let text = '暂无';
                if (inviteMeta.status === 'valid') {
                    color = 'green';
                    text = '有效';
                } else if (inviteMeta.status === 'expired') {
                    color = 'red';
                    text = '失效';
                }

                const deadlineText = inviteMeta.expireUnix
                    ? moment.unix(inviteMeta.expireUnix).format('YYYY-MM-DD HH:mm:ss')
                    : '-';

                return (
                    <div className="invite-deadline-cell">
                        <span className="invite-deadline-text">{deadlineText}</span>
                        <Tag color={color}>{text}</Tag>
                    </div>
                );
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => {
                return (
                    <Space size="small" wrap>
                        <Button
                            type="link"
                            className="inline-link-button"
                            onClick={() => openEditModal(record)}
                        >
                            编辑
                        </Button>
                        <Button
                            type="link"
                            className="inline-link-button"
                            danger
                            onClick={() => handleDeleteGroup(record)}
                        >
                            删除
                        </Button>
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="teaching-group-manage">
            <div className="teaching-group-toolbar">
                <Form form={searchForm} layout="inline" onFinish={onSearch} className="search-form">
                    <Form.Item name="name" label="教学组名称">
                        <Input placeholder="请输入教学组名称关键字" allowClear />
                    </Form.Item>
                    <Form.Item>
                        <Space wrap>
                            <Button type="primary" htmlType="submit">查询</Button>
                            <Button onClick={onReset}>重置</Button>
                            <Button icon={<ReloadOutlined />} onClick={refreshList}>刷新</Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                                创建教学组
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={tableData}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                }}
                onChange={handleTableChange}
                scroll={{ x: 1200 }}
            />

            <Modal
                title={editingGroup ? '编辑教学组' : '创建教学组'}
                open={groupModalOpen}
                onOk={handleSaveGroup}
                onCancel={() => {
                    setGroupModalOpen(false);
                    setEditingGroup(null);
                    groupForm.resetFields();
                    setTeacherOptions([]);
                }}
                okText={editingGroup ? '保存' : '创建'}
                cancelText="取消"
                confirmLoading={groupSaving}
                destroyOnHidden
            >
                <Form form={groupForm} layout="vertical" initialValues={{ teacher_ids: [] }}>
                    <Form.Item
                        name="name"
                        label="教学组名称"
                        rules={[{ required: true, message: '请输入教学组名称' }]}
                    >
                        <Input placeholder="例如：一班教学组" maxLength={255} />
                    </Form.Item>
                    <Form.Item
                        name="teacher_ids"
                        label="任课老师"
                        extra="输入老师姓名前缀检索，可多选"
                    >
                        <Select
                            mode="multiple"
                            showSearch
                            allowClear
                            placeholder="请输入老师姓名前缀"
                            filterOption={false}
                            loading={teacherFetching}
                            options={teacherOptions}
                            onSearch={(keyword) => {
                                if (!keyword || !keyword.trim()) {
                                    return;
                                }
                                debouncedTeacherSearch(keyword);
                            }}
                            notFoundContent={teacherFetching ? '检索中...' : '暂无匹配老师'}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <InviteCodeModal
                open={inviteModalOpen}
                courseId={courseId}
                schoolId={currentSchoolId}
                targetGroup={inviteTarget}
                initialTtl={inviteTarget ? getInviteMeta(inviteTarget).ttl : undefined}
                onCancel={() => {
                    setInviteModalOpen(false);
                    setInviteTarget(null);
                }}
                onSuccess={() => {
                    setInviteModalOpen(false);
                    setInviteTarget(null);
                    refreshList();
                }}
            />
        </div>
    );
};

export default TeachingGroupManage;
