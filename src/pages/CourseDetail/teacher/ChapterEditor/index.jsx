import React, { useCallback, useEffect, useState } from 'react';
import { Button, message, Modal, Space, Spin } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  getCourseLessonOutline,
  publishCourseOutline,
  saveCourseDraft,
  updateChapterTitleQuick,
  updateLessonQuick,
} from '@/http/api';
import ChapterItem from './ChapterItem';
import LessonEditorDrawer from './LessonEditorDrawer';
import {
  applyPublishIdMappings,
  normalizeCourseOutlineDraft,
  reindexCourseOutlineDraft,
} from '@/utils/courseOutline';
import './index.less';

const DELETE_ZONE_ID = 'outline-delete-zone';

const DeleteZone = () => {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: DELETE_ZONE_ID,
  });

  return (
    <div
      ref={setNodeRef}
      className={`outline-delete-zone ${isOver ? 'active' : ''}`}
    >
      <div className="delete-zone-inner">
        <DeleteOutlined style={{ fontSize: 24, color: '#c3c0c0' }} />
        <span className="delete-zone-text">拖到此处删除</span>
      </div>
    </div>
  );
};

const CourseOutline = ({ courseId }) => {
  const [outlineDraft, setOutlineDraft] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [loadingOutline, setLoadingOutline] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [importingPublished, setImportingPublished] = useState(false);
  const [savingChapterId, setSavingChapterId] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetectionStrategy = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    const deleteZoneCollision = pointerCollisions.find(
      (collision) => String(collision.id) === DELETE_ZONE_ID
    );

    if (deleteZoneCollision) {
      return [deleteZoneCollision];
    }

    return closestCenter(args);
  }, []);

  const syncEditingLesson = useCallback((lessonUpdater) => {
    setEditingLesson((prev) => {
      if (!prev) {
        return prev;
      }

      return typeof lessonUpdater === 'function' ? lessonUpdater(prev) : { ...prev, ...lessonUpdater };
    });
  }, []);

  const fetchOutline = useCallback(async () => {
    if (!courseId) {
      message.warning('课程ID缺失，无法加载章节课时数据');
      return;
    }

    setLoadingOutline(true);
    try {
      const res = await getCourseLessonOutline(courseId);
      const rawData = res?.data || res;
      const normalized = reindexCourseOutlineDraft(
        normalizeCourseOutlineDraft(rawData, {
          course_id: courseId,
          school_id: rawData?.school_id || '',
          status: rawData?.status ?? 0,
        })
      );
      setOutlineDraft(normalized);
    } catch (error) {
      console.error('Load course outline failed:', error);
    } finally {
      setLoadingOutline(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchOutline();
  }, [fetchOutline]);

  const updateOutlineChapters = useCallback((updater) => {
    setOutlineDraft((prev) => {
      if (!prev) {
        return prev;
      }

      const nextChapters = typeof updater === 'function' ? updater(prev.chapters) : updater;
      return reindexCourseOutlineDraft({
        ...prev,
        chapters: nextChapters,
      });
    });
  }, []);

  const updateEditingLessonPatch = useCallback((updatedLesson) => {
    syncEditingLesson((prev) => {
      if (prev.chapterId !== updatedLesson.chapterId || prev.lesson_id !== updatedLesson.lesson_id) {
        return prev;
      }

      return {
        ...prev,
        ...updatedLesson,
      };
    });
  }, [syncEditingLesson]);

  const updateLessonInOutline = useCallback((updatedLesson) => {
    const { chapterId, ...lessonPatch } = updatedLesson;

    updateOutlineChapters((chapters) => chapters.map((chapter) => {
      if (chapter.chapter_id !== chapterId) {
        return chapter;
      }

      return {
        ...chapter,
        lessons: chapter.lessons.map((lesson) => {
          if (lesson.lesson_id !== updatedLesson.lesson_id) {
            return lesson;
          }

          return {
            ...lesson,
            ...lessonPatch,
          };
        }),
      };
    }));
  }, [updateOutlineChapters]);

  const buildOutlinePayload = useCallback((draft = outlineDraft) => {
    if (!draft) {
      return null;
    }

    return reindexCourseOutlineDraft(draft);
  }, [outlineDraft]);

  const handleSaveDraft = () => {
    const draftContent = buildOutlinePayload();
    if (!draftContent || !courseId) {
      message.warning('暂无可保存的大纲内容');
      return;
    }

    setSavingDraft(true);
    saveCourseDraft({
      course_id: courseId,
      draft_content: draftContent,
    })
      .then((res) => {
        if (res?.code === 200 || res?.data?.updated || res?.updated) {
          message.success('已保存草稿');
          return;
        }

        throw new Error(res?.msg || '保存草稿失败');
      })
      .catch((error) => {
        console.error('Save course draft failed:', error);
      })
      .finally(() => {
        setSavingDraft(false);
      });
  };

  const handleImportPublishedOutline = async () => {
    if (!courseId) {
      message.warning('课程ID缺失，无法导入大纲');
      return;
    }

    setImportingPublished(true);

    try {
      const outlineRes = await getCourseLessonOutline(courseId, 'published');
      const outlineData = outlineRes?.data || outlineRes;
      const normalized = reindexCourseOutlineDraft(
        normalizeCourseOutlineDraft(outlineData, outlineDraft || {
          course_id: courseId,
          school_id: outlineData?.school_id || '',
          status: outlineData?.status ?? 0,
        })
      );

      setOutlineDraft(normalized);
      message.success('已导入已发布大纲');
    } catch (error) {
      console.error('Import published outline failed:', error);
    } finally {
      setImportingPublished(false);
    }
  };

  const handlePublish = () => {
    const draftContent = buildOutlinePayload();
    if (!draftContent || !courseId) {
      message.warning('暂无可发布的大纲内容');
      return;
    }

    Modal.confirm({
      title: '确认发布大纲',
      content: '发布后会立即同步章节与课时数据，是否继续？',
      okText: '确认发布',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        setPublishing(true);
        try {
          const res = await publishCourseOutline({
            course_id: courseId,
            draft_content: draftContent,
          });
          const publishData = res?.data || res;

          if (!(res?.code === 200 || publishData?.published)) {
            throw new Error(res?.msg || '发布大纲失败');
          }

          if (publishData?.id_mappings) {
            const mappedOutline = reindexCourseOutlineDraft(
              applyPublishIdMappings(draftContent, publishData.id_mappings)
            );
            setOutlineDraft(mappedOutline);
            setEditingLesson((prev) => {
              if (!prev) {
                return prev;
              }

              const chapterIdMap = new Map((publishData.id_mappings.chapters || []).map((item) => [item.temp_id, item.real_id]));
              const lessonIdMap = new Map((publishData.id_mappings.lessons || []).map((item) => [item.temp_id, item.real_id]));

              return {
                ...prev,
                chapterId: chapterIdMap.get(prev.chapterId) || prev.chapterId,
                lesson_id: lessonIdMap.get(prev.lesson_id) || prev.lesson_id,
              };
            });
          }

          message.success('大纲已发布');
        } catch (error) {
          console.error('Publish course outline failed:', error);
          throw error;
        } finally {
          setPublishing(false);
        }
      },
    });
  };

  const handleAddChapter = () => {
    const newChapter = {
      chapter_id: `temp_chapter_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: '未命名章节',
      sort_order: outlineDraft?.chapters?.length + 1 || 1,
      lessons: []
    };

    setOutlineDraft((prev) => {
      const draft = prev || {
        course_id: courseId || '',
        school_id: '',
        status: 0,
        chapters: [],
      };

      return reindexCourseOutlineDraft({
        ...draft,
        chapters: [...draft.chapters, newChapter],
      });
    });
  };

  const handleAddLesson = (chapterId) => {
    setOutlineDraft((prev) => {
      if (!prev) {
        return prev;
      }

      return reindexCourseOutlineDraft({
        ...prev,
        chapters: prev.chapters.map((chapter) => {
          if (chapter.chapter_id !== chapterId) {
            return chapter;
          }

          return {
            ...chapter,
            lessons: [
              ...chapter.lessons,
              {
                lesson_id: `temp_lesson_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                title: '新建课时',
                description: '',
                sort_order: chapter.lessons.length + 1,
                video_path: null,
                resource_name: '',
                duration: 0
              }
            ]
          };
        }),
      });
    });
  };

  const patchChapterTitleInDraft = useCallback((chapterId, newTitle) => {
    const nextTitle = String(newTitle || '').trim();
    if (!nextTitle) {
      return;
    }

    setOutlineDraft((prev) => {
      if (!prev) {
        return prev;
      }

      return reindexCourseOutlineDraft({
        ...prev,
        chapters: prev.chapters.map((chapter) => (
          chapter.chapter_id === chapterId
            ? { ...chapter, title: nextTitle }
            : chapter
        )),
      });
    });
  }, []);

  const handleRenameChapter = async (chapterId, newTitle) => {
    if (!outlineDraft || !courseId) {
      return;
    }

    const nextTitle = String(newTitle || '').trim();
    if (!nextTitle) {
      return;
    }

    const nextDraft = reindexCourseOutlineDraft({
      ...outlineDraft,
      chapters: outlineDraft.chapters.map((chapter) => (
        chapter.chapter_id === chapterId
          ? { ...chapter, title: nextTitle }
          : chapter
      )),
    });

    setSavingChapterId(chapterId);
    try {
      const targetChapter = nextDraft.chapters.find((chapter) => chapter.chapter_id === chapterId);
      const res = await updateChapterTitleQuick({
        course_id: courseId,
        draft_content: nextDraft,
        chapter: {
          chapter_id: chapterId,
          title: targetChapter?.title || nextTitle,
        },
      });

      if (!(res?.code === 200 || res?.data?.updated || res?.updated)) {
        throw new Error(res?.msg || '章节标题保存失败');
      }

      setOutlineDraft(nextDraft);
      message.success('章节标题已保存');
    } catch (error) {
      console.error('Update chapter title failed:', error);
    } finally {
      setSavingChapterId('');
    }
  };

  const handleEditLesson = (chapterId, lesson) => {
    setEditingLesson({ chapterId, ...lesson });
  };

  const handleLessonPreviewChange = (updatedLesson) => {
    updateLessonInOutline(updatedLesson);
    updateEditingLessonPatch(updatedLesson);
  };

  const handleSaveLessonDraft = async (updatedLesson) => {
    if (!outlineDraft || !courseId) {
      return;
    }

    const nextDraft = reindexCourseOutlineDraft({
      ...outlineDraft,
      chapters: outlineDraft.chapters.map((chapter) => {
        if (chapter.chapter_id !== updatedLesson.chapterId) {
          return chapter;
        }

        return {
          ...chapter,
          lessons: chapter.lessons.map((lesson) => (
            lesson.lesson_id === updatedLesson.lesson_id
              ? {
                ...lesson,
                ...updatedLesson,
              }
              : lesson
          )),
        };
      }),
    });

    setOutlineDraft(nextDraft);
    setEditingLesson(null);
  };

  const handleSaveLessonImmediate = async (updatedLesson) => {
    if (!outlineDraft || !courseId) {
      return;
    }

    const currentChapter = outlineDraft.chapters.find((chapter) => chapter.chapter_id === updatedLesson.chapterId);
    const currentLesson = currentChapter?.lessons.find((lesson) => lesson.lesson_id === updatedLesson.lesson_id);
    const nextDraft = reindexCourseOutlineDraft({
      ...outlineDraft,
      chapters: outlineDraft.chapters.map((chapter) => {
        if (chapter.chapter_id !== updatedLesson.chapterId) {
          return chapter;
        }

        return {
          ...chapter,
          lessons: chapter.lessons.map((lesson) => (
            lesson.lesson_id === updatedLesson.lesson_id
              ? {
                ...lesson,
                ...updatedLesson,
              }
              : lesson
          )),
        };
      }),
    });

    try {
      const res = await updateLessonQuick({
        course_id: courseId,
        draft_content: nextDraft,
        lesson: {
          lesson_id: updatedLesson.lesson_id,
          chapter_id: updatedLesson.chapterId,
          title: updatedLesson.title,
          description: updatedLesson.description || '',
          video_path: updatedLesson.video_path ?? null,
          duration: typeof updatedLesson.duration === 'number' ? updatedLesson.duration : (currentLesson?.duration || 0),
          sort_order: typeof currentLesson?.sort_order === 'number' ? currentLesson.sort_order : (updatedLesson.sort_order || 1),
        },
      });

      if (!(res?.code === 200 || res?.data?.updated || res?.updated)) {
        throw new Error(res?.msg || '课时保存失败');
      }

      setOutlineDraft(nextDraft);
      setEditingLesson(null);
      message.success('课时已更新');
    } catch (error) {
      console.error('Update lesson failed:', error);
      throw error;
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const activeId = String(active.id);

    if (overId === DELETE_ZONE_ID) {
      const activeType = active.data.current?.type;

      if (activeType === 'chapter') {
        const deletingChapterId = activeId;
        setOutlineDraft((prev) => {
          if (!prev) {
            return prev;
          }

          return reindexCourseOutlineDraft({
            ...prev,
            chapters: prev.chapters.filter((chapter) => chapter.chapter_id !== deletingChapterId),
          });
        });

        if (editingLesson?.chapterId === deletingChapterId) {
          setEditingLesson(null);
        }

        message.success('章节已删除');
        return;
      }

      if (activeType === 'lesson') {
        const deletingChapterId = String(active.data.current?.chapterId || '');
        const deletingLessonId = activeId;

        setOutlineDraft((prev) => {
          if (!prev) {
            return prev;
          }

          return reindexCourseOutlineDraft({
            ...prev,
            chapters: prev.chapters.map((chapter) => {
              if (chapter.chapter_id !== deletingChapterId) {
                return chapter;
              }

              return {
                ...chapter,
                lessons: chapter.lessons.filter((lesson) => lesson.lesson_id !== deletingLessonId),
              };
            }),
          });
        });

        if (editingLesson?.lesson_id === deletingLessonId && editingLesson?.chapterId === deletingChapterId) {
          setEditingLesson(null);
        }

        message.success('课时已删除');
        return;
      }
    }

    if (!outlineDraft || activeId === overId) {
      return;
    }

    if (activeId !== overId) {
      const activeType = active.data.current?.type;
      const overType = over.data.current?.type;

      if (!activeType || !overType) return;

      // 章节排序
      if (activeType === 'chapter' && overType === 'chapter') {
        setOutlineDraft((prev) => {
          if (!prev) {
            return prev;
          }

          const items = prev.chapters;
          const oldIndex = items.findIndex(item => item.chapter_id === activeId);
          const newIndex = items.findIndex(item => item.chapter_id === overId);
          return reindexCourseOutlineDraft({
            ...prev,
            chapters: arrayMove(items, oldIndex, newIndex),
          });
        });
      }

      // 课时排序 (只允许在同一个章节内排序)
      if (activeType === 'lesson' && overType === 'lesson') {
        const activeChapterId = active.data.current?.chapterId;
        const overChapterId = over.data.current?.chapterId;

        if (activeChapterId === overChapterId) {
          setOutlineDraft((prev) => {
            if (!prev) {
              return prev;
            }

            return reindexCourseOutlineDraft({
              ...prev,
              chapters: prev.chapters.map((chap) => {
                if (chap.chapter_id === activeChapterId) {
                  const oldIndex = chap.lessons.findIndex(l => l.lesson_id === activeId);
                  const newIndex = chap.lessons.findIndex(l => l.lesson_id === overId);
                  return {
                    ...chap,
                    lessons: arrayMove(chap.lessons, oldIndex, newIndex)
                  };
                }
                return chap;
              }),
            });
          });
        }
      }
    }
  };

  const chapterIds = outlineDraft?.chapters.map(c => c.chapter_id) || [];

  return (
    <div className="course-outline-wrapper">
      <div className="outline-header">
        <h3 className="outline-title">课程大纲构建</h3>
        <Space>
          <Button onClick={handleSaveDraft} loading={savingDraft}>存为草稿</Button>
          <Button onClick={handleImportPublishedOutline} loading={importingPublished}>导入已发布大纲</Button>
          <Button type="primary" onClick={handlePublish} loading={publishing}>发布大纲</Button>
        </Space>
      </div>

      <div className="outline-content">
        {loadingOutline && !outlineDraft ? (
          <div className="outline-loading">
            <Spin tip="加载课程大纲中..." />
          </div>
        ) : null}

        <div className="outline-body">
          <div className="outline-main">
            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetectionStrategy}
              onDragEnd={handleDragEnd}
            >
              <div className="outline-dnd-layout">
                <DeleteZone />
                <div className="chapter-list-container">
                  <SortableContext
                    items={chapterIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {outlineDraft?.chapters.map((chapter, index) => (
                      <ChapterItem
                        key={chapter.chapter_id}
                        chapter={chapter}
                        index={index}
                        onAddLesson={handleAddLesson}
                        onRenameChapterDraft={patchChapterTitleInDraft}
                        onRenameChapter={handleRenameChapter}
                        onEditLesson={handleEditLesson}
                        savingChapterId={savingChapterId}
                      />
                    ))}
                  </SortableContext>
                </div>
              </div>
            </DndContext>

            <div className="add-chapter-btn" onClick={handleAddChapter}>
              <PlusOutlined /> 添加新章节
            </div>
          </div>
        </div>
      </div>

      <LessonEditorDrawer
        key={editingLesson?.lesson_id || 'lesson-drawer-empty'}
        visible={!!editingLesson}
        lesson={editingLesson}
        courseId={courseId}
        onClose={() => setEditingLesson(null)}
        onChange={handleLessonPreviewChange}
        onSave={handleSaveLessonDraft}
        onImmediateSave={handleSaveLessonImmediate}
      />
    </div>
  );
};

export default CourseOutline;
