import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tag } from 'antd';
import { HolderOutlined, PlaySquareOutlined } from '@ant-design/icons';
import './LessonItem.less';
const LessonItem = ({ lesson, chapterId, chapterIndex, lessonIndex, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lesson.lesson_id,
    data: { type: 'lesson', lesson, chapterId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: 'relative',
  };

  const isMounted = !!lesson.resource_id;

  return (
    <div className="lesson-item-wrapper" ref={setNodeRef} style={style}>
      <div className="lesson-drag-handle" {...attributes} {...listeners}>
        <HolderOutlined />
      </div>
      <div className="lesson-content" onClick={onEdit}>
        <PlaySquareOutlined className="lesson-icon" />
        <span className="lesson-title">{(chapterIndex + 1)}.{lessonIndex + 1} {lesson.title || '未命名课时'}</span>
      </div>
      <div className="lesson-extra" onClick={onEdit}>
        {isMounted ? (
          <Tag color="blue" className="lesson-mount-tag">已挂载: {lesson.resource_name || '视频文件'}</Tag>
        ) : (
          <Tag color="error" className="lesson-mount-tag">未挂载</Tag>
        )}
      </div>
    </div>
  );
};

export default LessonItem;
