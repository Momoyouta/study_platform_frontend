import React, { useState, useEffect } from 'react';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import { Button, message, Spin, Space, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getCourseDescription, updateCourseDescription } from '@/http/api';
import './index.less';
import Title from 'antd/es/typography/Title';

const TaskEditor = ({ courseId }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const fetchDescription = () => {
        if (!courseId) return;
        setLoading(true);
        setError(null);
        getCourseDescription(courseId)
            .then((res) => {
                if (res.code === 200 || res.data !== undefined) {
                    const desc = typeof res.data === 'string' ? res.data : (res.data?.description || '');
                    setContent(desc);
                } else {
                    setError(res.msg || '获取课程任务失败');
                }
            })
            .catch((err) => {
                console.error('Fetch description failed:', err);
                setError('获取课程任务接口异常');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchDescription();
    }, [courseId]);

    const handleSave = () => {
        setSaving(true);
        updateCourseDescription({
            id: courseId,
            description: content
        })
            .then((res) => {
                if (res.code === 200 || res.success) {
                    message.success('任务内容保存成功');
                } else {
                    message.error(res.msg || '保存失败');
                }
            })
            .catch((err) => {
                console.error('Save description failed:', err);
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const handleUploadImg = () => {
        message.warning('当前暂不支持上传图片');
        return false;
    };

    if (loading) {
        return (
            <div className="task-editor-loading">
                <Spin tip="正在加载任务内容..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="task-editor-error">
                <Alert
                    message="加载失败"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" type="primary" onClick={fetchDescription}>
                            重试
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="task-editor-container">
            <Title level={2} className="group-title">课程任务</Title>
            <div className="editor-header">
                <Space>
                    <span className="info-tips">支持 Markdown 语法编辑，图片上传已被禁用。</span>
                </Space>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSave}
                >
                    保存任务修改
                </Button>
            </div>
            <div className="editor-body">
                <MdEditor
                    modelValue={content}
                    onChange={setContent}
                    onUploadImg={handleUploadImg}
                    placeholder="请输入课程任务或描述内容..."
                    onPaste={(event) => {
                        const items = event.clipboardData?.items;
                        if (items) {
                            for (let i = 0; i < items.length; i++) {
                                if (items[i].type.indexOf('image') !== -1) {
                                    event.preventDefault();
                                    message.warning('禁止粘贴图片内容');
                                    return;
                                }
                            }
                        }
                    }}
                    toolbars={[
                        'bold',
                        'underline',
                        'italic',
                        '-',
                        'title',
                        'strikeThrough',
                        'sub',
                        'sup',
                        'quote',
                        'unorderedList',
                        'orderedList',
                        'task',
                        '-',
                        'codeRow',
                        'code',
                        'link',
                        'table',
                        'mermaid',
                        'katex',
                        '-',
                        'revoke',
                        'next',
                        'save',
                        '=',
                        'pageFullscreen',
                        'fullscreen',
                        'preview',
                        'htmlPreview',
                        'catalog'
                    ]}
                    style={{}}
                    className="task-md-editor"
                />
            </div>
        </div>
    );
};

export default TaskEditor;
