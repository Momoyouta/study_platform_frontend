import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import {
    Card,
    Input,
    Button,
    Table,
    Space,
    Typography,
    Tooltip,
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
} from '@ant-design/icons';
import { queryFiles } from '@/http/api';
import { downloadFile } from '@/utils/download';
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

const formatDate = (val: string) => {
    if (!val) return '-';

    const date = new Date(val);
    if (isNaN(date.getTime())) return val;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const formatFileSize = (bytes: any) => {
    const size = Number(bytes);
    if (isNaN(size) || size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ── 组件 ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const ResourcePlaza = observer(() => {
    const { UserStore } = useStore();
    const schoolId = UserStore.schoolId;

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const loadData = useCallback(async (page = 1, filename = '') => {
        if (!schoolId) return;
        setLoading(true);
        try {
            const params = {
                page: Number(page) || 1,
                pageSize: Number(PAGE_SIZE) || 10,
                schoolId,
                filename: filename || undefined,
            };

            const res: any = await queryFiles(params);
            if (res?.code === 200) {
                setData(res.data?.items || []);
                setTotal(res.data?.total || 0);
            } else {
                message.error(res?.msg || '获取列表失败');
            }
        } catch (error: any) {
            console.error('Failed to fetch files', error);
        } finally {
            setLoading(false);
        }
    }, [schoolId]);

    useEffect(() => {
        if (schoolId) {
            loadData(1, '');
        }
    }, [schoolId, loadData]);

    const handleSearch = () => {
        setCurrentPage(1);
        loadData(1, searchText);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadData(page, searchText);
    };


    const columns: ColumnType<any>[] = [
        {
            title: '文件名',
            dataIndex: 'fileName',
            key: 'fileName',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: '文件类型',
            key: 'fileType',
            width: 120,
            render: (_: any, record: any) => {
                const info = getFileTypeInfo(record.fileName || '');
                return (
                    <Space>
                        <span style={{ fontSize: 18, color: '#595959' }}>{info.icon}</span>
                        <Text type="secondary">{info.text}</Text>
                    </Space>
                );
            },
        },
        {
            title: '大小',
            dataIndex: 'fileSize',
            key: 'fileSize',
            width: 100,
            render: (size: any) => <Text type="secondary">{formatFileSize(size)}</Text>,
        },
        {
            title: '上传日期',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 150,
            render: (ts: string) => <Text type="secondary">{formatDate(ts)}</Text>,
        },
        {
            title: '操作',
            key: 'action',
            width: 80,
            render: (_: any, record: any) => {
                return (
                    <Space size="small" className="item-actions">
                        <Tooltip title="下载">
                            <Button
                                type="text"
                                icon={<DownloadOutlined />}
                                onClick={() => downloadFile({
                                    schoolId: record.schoolId || schoolId,
                                    fileHash: record.fileHash,
                                    fileName: record.fileName
                                })}
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    return (
        <Card className="resource-plaza-container" bordered={false}>
            <div className="plaza-header">
                <Title level={2}>资源广场</Title>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
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
                        placeholder="在广场中搜索文件..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 450 }}
                        size="large"
                        allowClear
                    />
                </div>
                <div style={{ width: 100 }}></div> {/* 占位平衡布局 */}
            </div>

            <div className="plaza-table-wrapper">
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: PAGE_SIZE,
                        total: total,
                        onChange: handlePageChange,
                        showSizeChanger: false,
                        position: ['bottomRight'],
                    }}
                    className="plaza-table"
                />
            </div>
        </Card>
    );
});

export default ResourcePlaza;
