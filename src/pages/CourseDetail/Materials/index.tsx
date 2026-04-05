import { useState, useEffect, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { ROLE_MAP, SCENARIO_MAP } from '@/type/map.js';
import {
    Card,
    Input,
    Button,
    Table,
    Space,
    Typography,
    Tooltip,
    Modal,
    Form,
    Drawer,
    message,
} from 'antd';
import {
    SearchOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    FilePptOutlined,
    FileImageOutlined,
    FileWordOutlined,
    FileUnknownOutlined,
    DownloadOutlined,
    DeleteOutlined,
    EditOutlined,
    CloudUploadOutlined,
} from '@ant-design/icons';
import FileChunkUpload from '@/components/FileChunkUpload';
import { ChunkUploadType } from '@/http/api';
import type { ColumnType } from 'antd/es/table';
import Title from 'antd/es/typography/Title';
import './index.less';

const { Text } = Typography;

// ── 工具函数 ─────────────────────────────────────────────────────────────────

const getFileTypeInfo = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const displayText = ext ? ext.toUpperCase() : 'Unknown';
    
    let icon = <FileUnknownOutlined />;
    switch (ext) {
        case 'pdf':
            icon = <FilePdfOutlined />;
            break;
        case 'md':
        case 'txt':
            icon = <FileTextOutlined />;
            break;
        case 'ppt':
        case 'pptx':
            icon = <FilePptOutlined />;
            break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            icon = <FileImageOutlined />;
            break;
        case 'doc':
        case 'docx':
            icon = <FileWordOutlined />;
            break;
    }
    
    return { text: displayText, icon };
};

const formatDate = (timestamp: string) => {
    if (!timestamp) return '-';
    let ts = Number(timestamp);
    if (isNaN(ts)) return timestamp;
    
    // 如果是 10 位时间戳（秒），转换为毫秒
    if (timestamp.toString().length === 10) {
        ts *= 1000;
    }
    
    const date = new Date(ts);
    if (isNaN(date.getTime())) return timestamp;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

// ── 组件 ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const Materials = observer(() => {
    const { UserStore, CourseStore } = useStore();
    const isStudent = UserStore.role === ROLE_MAP.STUDENT;
    const courseId = CourseStore.currentCourseId;

    // 搜索
    const [searchText, setSearchText] = useState('');
    // 分页
    const [currentPage, setCurrentPage] = useState(1);
    // 上传 Drawer
    const [uploadVisible, setUploadVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    // 重命名 Modal
    const [renameVisible, setRenameVisible] = useState(false);
    const [renamingRecord, setRenamingRecord] = useState<any>(null);
    const [renameForm] = Form.useForm();

    // ── 数据加载 ───────────────────────────────────────────────────────────
    const loadMaterials = useCallback(
        (page = currentPage, fileName = searchText) => {
            if (!courseId) return;
            CourseStore.fetchMaterials({ courseId, fileName: fileName || undefined, page, pageSize: PAGE_SIZE });
        },
        [courseId, CourseStore, currentPage, searchText]
    );

    useEffect(() => {
        loadMaterials(1, '');
    }, [courseId]);

    // ── 搜索 ───────────────────────────────────────────────────────────────
    const handleSearch = () => {
        setCurrentPage(1);
        loadMaterials(1, searchText);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    const handleSearchPressEnter = () => {
        handleSearch();
    };

    // ── 分页 ───────────────────────────────────────────────────────────────
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadMaterials(page, searchText);
    };

    // ── 上传 ───────────────────────────────────────────────────────────────
    // 存储当前正在绑定的 fileId，用于显示加载状态
    const [bindingFileId, setBindingFileId] = useState<string | null>(null);

    const handleUploadSuccess = async (_path: string, fileId?: string) => {
        if (!fileId) return;
        
        setBindingFileId(fileId);
        setUploading(true);
        try {
            await CourseStore.bindMaterial(courseId, fileId);
            message.success('资料上传并绑定成功');
            setUploadVisible(false);
            setCurrentPage(1);
            loadMaterials(1, searchText);
        } catch (err: any) {
            message.error(err?.message || '自动绑定失败，请稍后重试');
        } finally {
            setUploading(false);
            setBindingFileId(null);
        }
    };

    const handleUploadDrawerClose = () => {
        if (uploading) {
            message.warning('正在处理中，请稍候...');
            return;
        }
        setUploadVisible(false);
    };

    // ── 下载 ───────────────────────────────────────────────────────────────
    const handleDownload = (record: any) => {
        if (!record.file_id) {
            message.warning('暂无可下载的文件');
            return;
        }
        window.open(`/file/download/${record.file_id}`, '_blank');
    };

    // ── 重命名 ─────────────────────────────────────────────────────────────
    // 存储当前重命名的文件名后缀
    const [fileExtension, setFileExtension] = useState('');

    const handleRenameOpen = (record: any) => {
        setRenamingRecord(record);
        const fileName = record.file_name || '';
        const lastDotIndex = fileName.lastIndexOf('.');
        
        let namePrefix = fileName;
        let extension = '';
        
        if (lastDotIndex !== -1) {
            namePrefix = fileName.substring(0, lastDotIndex);
            extension = fileName.substring(lastDotIndex);
        }
        
        setFileExtension(extension);
        renameForm.setFieldsValue({ file_prefix: namePrefix });
        setRenameVisible(true);
    };

    const handleRenameConfirm = async () => {
        try {
            const { file_prefix } = await renameForm.validateFields();
            const fullName = `${file_prefix}${fileExtension}`;
            await CourseStore.updateMaterialName(renamingRecord.id, fullName);
            message.success('重命名成功');
            setRenameVisible(false);
            loadMaterials(currentPage, searchText);
        } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || '重命名失败');
        }
    };

    // ── 删除 ───────────────────────────────────────────────────────────────
    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '删除课程资料',
            content: (
                <div>
                    <p>请选择删除方式：</p>
                    <p>• <b>仅解绑</b>：从课程中移除，文件仍保留在资源库</p>
                    <p>• <b>彻底删除</b>：从课程及资源库中永久删除</p>
                </div>
            ),
            okText: '仅解绑',
            cancelText: '取消',
            footer: (_, { OkBtn, CancelBtn }) => (
                <Space>
                    <CancelBtn />
                    <Button
                        danger
                        onClick={async () => {
                            try {
                                await CourseStore.deleteMaterial(record.id, 2);
                                message.success('已彻底删除');
                                loadMaterials(currentPage, searchText);
                            } catch (err: any) {
                                message.error(err?.message || '删除失败');
                            }
                            Modal.destroyAll();
                        }}
                    >
                        彻底删除
                    </Button>
                    <OkBtn />
                </Space>
            ),
            onOk: async () => {
                await CourseStore.deleteMaterial(record.id, 1);
                message.success('已解绑');
                loadMaterials(currentPage, searchText);
            },
            centered: true,
        });
    };

    // ── 表格列定义 ─────────────────────────────────────────────────────────
    const columns: ColumnType<any>[] = [
        {
            title: '文件名',
            dataIndex: 'file_name',
            key: 'file_name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: '文件类型',
            key: 'fileType',
            width: 100,
            render: (_: any, record: any) => {
                const info = getFileTypeInfo(record.file_name || '');
                return (
                    <Space>
                        <span style={{ fontSize: 18, color: '#595959' }}>{info.icon}</span>
                        <Text type="secondary">{info.text}</Text>
                    </Space>
                );
            },
        },
        {
            title: '上传者',
            dataIndex: 'uploader_name',
            key: 'uploader_name',
            width: 120,
            render: (name: string) => <Text type="secondary">{name || '-'}</Text>,
        },
        {
            title: '上传日期',
            dataIndex: 'create_time',
            key: 'create_time',
            width: 120,
            render: (ts: string) => <Text type="secondary">{formatDate(ts)}</Text>,
        },
        {
            title: '操作',
            key: 'action',
            width: isStudent ? 80 : 140,
            render: (_: any, record: any) => (
                <Space size="small" className="material-actions">
                    <Tooltip title="下载">
                        <Button type="text" icon={<DownloadOutlined />} onClick={() => handleDownload(record)} />
                    </Tooltip>
                    {!isStudent && (
                        <>
                            <Tooltip title="重命名">
                                <Button type="text" icon={<EditOutlined />} onClick={() => handleRenameOpen(record)} />
                            </Tooltip>
                            <Tooltip title="删除">
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    // ── 渲染 ───────────────────────────────────────────────────────────────
    return (
        <Card className="materials-container" bordered={false}>
            <Title level={2} className="group-title">课程资料</Title>

            {/* ── 顶部工具栏 ── */}
            <div className="materials-header">
                <Input
                    suffix={
                        <SearchOutlined 
                            style={{ 
                                color: searchText ? '#1890ff' : 'rgba(0,0,0,.45)', 
                                cursor: 'pointer',
                                transition: 'color 0.3s'
                            }} 
                            onClick={handleSearch}
                        />
                    }
                    placeholder="请输入文件名进行搜索..."
                    value={searchText}
                    onChange={handleSearchChange}
                    onPressEnter={handleSearchPressEnter}
                    style={{ width: 400 }}
                    size="large"
                    allowClear
                />
                <Space>
                    {!isStudent && (
                        <Button
                            type="primary"
                            icon={<CloudUploadOutlined />}
                            size="large"
                            onClick={() => setUploadVisible(true)}
                        >
                            上传文件
                        </Button>
                    )}
                </Space>
            </div>

            {/* ── 资料表格 ── */}
            <div className="materials-table-wrapper">
                <Table
                    columns={columns}
                    dataSource={CourseStore.materials}
                    rowKey="id"
                    loading={CourseStore.materialsLoading}
                    pagination={{
                        current: currentPage,
                        pageSize: PAGE_SIZE,
                        total: CourseStore.materialsTotal,
                        onChange: handlePageChange,
                        showSizeChanger: false,
                        position: ['bottomRight'],
                    }}
                    className="materials-table"
                />
            </div>

            {/* ── 上传 Drawer ── */}
            <Drawer
                title="上传课程资料"
                open={uploadVisible}
                onClose={handleUploadDrawerClose}
                width={480}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={handleUploadDrawerClose} disabled={uploading}>关闭</Button>
                    </div>
                }
            >
                <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
                    支持上传任意类型的课程资料文件（PDF、PPT、Word、图片等），使用分片上传保证大文件稳定性。
                </p>
                <FileChunkUpload
                    onChange={handleUploadSuccess}
                    scenario={SCENARIO_MAP.TEMP_DOCUMENT}
                    businessConfig={{ courseId, schoolId: UserStore.schoolId || undefined }}
                    buttonText="选择课程资料文件"
                    uploadType={ChunkUploadType.NORMAL}
                    maxSizeMB={500}
                    mountedLabel="文件上传成功，点击确认绑定"
                />
            </Drawer>

            {/* ── 重命名 Modal ── */}
            <Modal
                title="修改文件名"
                open={renameVisible}
                onOk={handleRenameConfirm}
                onCancel={() => setRenameVisible(false)}
                okText="保存"
                cancelText="取消"
                centered
            >
                <Form form={renameForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="file_prefix"
                        label="新文件名"
                        rules={[{ required: true, message: '请输入文件名' }]}
                    >
                        <Input 
                            placeholder="请输入新的文件名" 
                            addonAfter={<Text type="secondary">{fileExtension}</Text>}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
});

export default Materials;
