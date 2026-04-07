import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { Button, Drawer, Form, Input, List, Modal, Space, Tooltip, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import FileChunkUpload from '@/components/FileChunkUpload';
import { queryLessonVideoLibrary } from '@/http/api';
import { SCENARIO_MAP } from '@/type/map.js';

import './LessonEditorDrawer.less';

const { TextArea } = Input;
const VIDEO_LIBRARY_PAGE_SIZE = 10;

const buildResourceState = (lesson) => ({
  video_path: lesson?.video_path ?? null,
  resource_name: lesson?.resource_name || '',
});

const getFileSuffix = (fileName) => {
  const normalized = String(fileName || '').trim();
  const lastDotIndex = normalized.lastIndexOf('.');

  if (lastDotIndex <= 0 || lastDotIndex === normalized.length - 1) {
    return '';
  }

  return normalized.slice(lastDotIndex);
};

const LessonEditorDrawer = observer(({ visible, lesson, courseId, onClose, onChange, onSave, onImmediateSave }) => {
  const { UserStore } = useStore();
  const schoolId = UserStore.schoolId;
  const [form] = Form.useForm();
  const [resourceState, setResourceState] = useState(() => buildResourceState(lesson));
  const [videoLibraryVisible, setVideoLibraryVisible] = useState(false);
  const [videoLibraryLoading, setVideoLibraryLoading] = useState(false);
  const [videoLibraryList, setVideoLibraryList] = useState([]);
  const [videoLibraryTotal, setVideoLibraryTotal] = useState(0);
  const [videoLibraryPage, setVideoLibraryPage] = useState(1);
  const [videoLibraryKeyword, setVideoLibraryKeyword] = useState('');
  const [videoLibraryAppliedKeyword, setVideoLibraryAppliedKeyword] = useState('');
  const canImmediateSave = !String(lesson?.lesson_id || '').startsWith('temp') && !String(lesson?.chapterId || '').startsWith('temp');
  const immediateSaveTip = canImmediateSave
    ? '立刻保存会立即更新并发布该课时。'
    : '立刻保存会立即更新并发布该课时，未发布内容不可立刻保存。';

  useEffect(() => {
    if (visible && lesson) {
      form.setFieldsValue({
        title: lesson.title,
        description: lesson.description || '',
      });
    } else {
      form.resetFields();
    }
  }, [visible, lesson, form]);

  useEffect(() => {
    if (visible) {
      setResourceState(buildResourceState(lesson));
    } else {
      setVideoLibraryVisible(false);
    }
  }, [visible, lesson]);

  const fetchVideoLibrary = async (page = 1, filename = '') => {
    if (!courseId) {
      message.warning('课程ID缺失，无法查询资源库视频');
      return;
    }

    setVideoLibraryLoading(true);
    try {
      const res = await queryLessonVideoLibrary({
        course_id: courseId,
        page,
        pageSize: VIDEO_LIBRARY_PAGE_SIZE,
        filename: filename || undefined,
      });

      if (res?.code === 200) {
        setVideoLibraryList(res?.data?.list || []);
        setVideoLibraryTotal(Number(res?.data?.total || 0));
      } else {
        setVideoLibraryList([]);
        setVideoLibraryTotal(0);
        message.error(res?.msg || '查询资源库视频失败');
      }
    } catch (error) {
      console.error('Query lesson video library failed:', error);
      setVideoLibraryList([]);
      setVideoLibraryTotal(0);
    } finally {
      setVideoLibraryLoading(false);
    }
  };

  const handleOpenVideoLibrary = async () => {
    if (!courseId) {
      message.warning('课程ID缺失，无法查询资源库视频');
      return;
    }

    setVideoLibraryVisible(true);
    setVideoLibraryPage(1);
    setVideoLibraryKeyword('');
    setVideoLibraryAppliedKeyword('');
    await fetchVideoLibrary(1, '');
  };

  const handleSearchVideoLibrary = async (value) => {
    const nextKeyword = String(value || '').trim();
    setVideoLibraryPage(1);
    setVideoLibraryAppliedKeyword(nextKeyword);
    await fetchVideoLibrary(1, nextKeyword);
  };

  const handleVideoLibraryPageChange = async (page) => {
    setVideoLibraryPage(page);
    await fetchVideoLibrary(page, videoLibraryAppliedKeyword);
  };

  const handleSelectVideoFromLibrary = (item) => {
    const targetPath = String(item?.target_path || '').replace(/\/+$/, '');
    const fileHash = String(item?.fileHash || '').trim();

    if (!targetPath || !fileHash) {
      message.error('该资源缺少可绑定信息');
      return;
    }

    const fileSuffix = getFileSuffix(item?.fileName);
    const mountedVideoPath = `${targetPath}/${fileHash}${fileSuffix}`;

    const nextLesson = {
      ...lesson,
      ...form.getFieldsValue(),
      video_path: mountedVideoPath,
      resource_name: item.fileName || '',
    };

    setResourceState({
      video_path: mountedVideoPath,
      resource_name: item.fileName || '',
    });

    onChange(nextLesson);
    setVideoLibraryVisible(false);
    message.success('已从资源库绑定教学视频');
  };

  const handleLocalSave = async () => {
    try {
      const values = await form.validateFields();

      await onSave({
        ...lesson,
        ...values,
        ...resourceState,
      });

      message.success('课时已保存');
    } catch (error) {
      console.error('Validation Error:', error);
    }
  };

  const handleImmediateSave = async () => {
    try {
      await form.validateFields();

      Modal.confirm({
        title: '立刻保存课时',
        content: '该操作会立马发布该更新，确认后将直接保存并关闭编辑弹层。',
        okText: '确认保存',
        cancelText: '取消',
        centered: true,
        onOk: async () => {
          await onImmediateSave({
            ...lesson,
            ...form.getFieldsValue(),
            ...resourceState,
          });
        },
      });
    } catch (error) {
      console.error('Validation Error:', error);
    }
  };

  const handleChunkUploadSuccess = (path) => {
    const fileName = path.split('/').pop() || 'video.mp4';
    const nextLesson = {
      ...lesson,
      ...form.getFieldsValue(),
      video_path: path,
      resource_name: fileName
    };
    setResourceState({
      video_path: path,
      resource_name: fileName,
    });
    onChange(nextLesson);
  };

  return (
    <Drawer
      title="编辑课时"
      placement="right"
      onClose={onClose}
      open={visible}
      width={450}
      footer={
        <div className="lesson-editor-drawer-footer">
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleLocalSave} icon={<SaveOutlined />}>
              保存课时
            </Button>
            <Tooltip title={immediateSaveTip} placement="top">
              <span>
                <Button onClick={handleImmediateSave} icon={<SaveOutlined />} disabled={!canImmediateSave}>
                  立刻保存
                </Button>
              </span>
            </Tooltip>
          </Space>
        </div>
      }
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="title"
          label="课时名称"
          rules={[{ required: true, message: '请输入课时名称' }]}
        >
          <Input placeholder="例如: 1.1 lesson" />
        </Form.Item>
        <Form.Item
          name="description"
          label="课时简介（选填）"
        >
          <TextArea placeholder="简要描述本节课的学习目标..." rows={4} />
        </Form.Item>
      </Form>

      <div className="lesson-editor-resource-section">
        <p className="resource-title">教学视频</p>
        <FileChunkUpload
          onChange={(path) => handleChunkUploadSuccess(path)}
          scenario={SCENARIO_MAP.TEMP_VIDEO}
          businessConfig={{ courseId, schoolId }}
          previewPath={resourceState?.video_path}
          buttonText="上传教学视频"
          accept="video/*"
          uploadType={2}
          mountedLabel="视频已挂载"
        />
        <Button
          block
          className="video-library-trigger-btn"
          onClick={handleOpenVideoLibrary}
        >
          从资源库选择
        </Button>
      </div>

      <Modal
        title="从资源库选择视频"
        open={videoLibraryVisible}
        onCancel={() => setVideoLibraryVisible(false)}
        footer={null}
        width={620}
        destroyOnHidden
      >
        <Input.Search
          className="lesson-video-library-search"
          placeholder="按文件名搜索，例如：第一章"
          allowClear
          value={videoLibraryKeyword}
          onChange={(e) => setVideoLibraryKeyword(e.target.value)}
          onSearch={handleSearchVideoLibrary}
        />

        <List
          className="lesson-video-library-list"
          loading={videoLibraryLoading}
          dataSource={videoLibraryList}
          locale={{ emptyText: '暂无可选视频资源' }}
          renderItem={(item) => (
            <List.Item
              className="lesson-video-library-item"
              onClick={() => handleSelectVideoFromLibrary(item)}
            >
              {item.fileName || '未命名文件'}
            </List.Item>
          )}
          pagination={{
            current: videoLibraryPage,
            pageSize: VIDEO_LIBRARY_PAGE_SIZE,
            total: videoLibraryTotal,
            showSizeChanger: false,
            hideOnSinglePage: true,
            onChange: handleVideoLibraryPageChange,
          }}
        />
      </Modal>
    </Drawer>
  );
});

export default LessonEditorDrawer;
