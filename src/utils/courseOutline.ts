// Course outline 工具函数（移植自 study_platform_admin_frontend）

export interface CourseOutlineLessonDto {
  lesson_id: string;
  title: string;
  description: string;
  resource_id: string | null;
  resource_name: string;
  sort_order: number;
  duration: number;
}

export interface CourseOutlineChapterDto {
  chapter_id: string;
  title: string;
  sort_order: number;
  lessons: CourseOutlineLessonDto[];
}

export interface CourseOutlineDraftDto {
  course_id: string;
  school_id: string;
  status: number;
  chapters: CourseOutlineChapterDto[];
}

export type CourseOutlineDraftContent = Pick<CourseOutlineDraftDto, 'chapters'>;

export interface PublishIdMappingsDto {
  chapters: Array<{ temp_id: string; real_id: string }>;
  lessons: Array<{ temp_id: string; real_id: string }>;
}

const toSafeString = (value: unknown, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const normalizeLesson = (lesson: Partial<CourseOutlineLessonDto>, index: number): CourseOutlineLessonDto => ({
  lesson_id: toSafeString(lesson.lesson_id, `temp_lesson_${index + 1}`),
  title: lesson.title || '未命名课时',
  description: lesson.description || '',
  resource_id: lesson.resource_id ?? null,
  resource_name: lesson.resource_name || '',
  sort_order: typeof lesson.sort_order === 'number' ? lesson.sort_order : index + 1,
  duration: typeof lesson.duration === 'number' ? lesson.duration : 0,
});

const normalizeChapter = (chapter: Partial<CourseOutlineChapterDto>, index: number): CourseOutlineChapterDto => ({
  chapter_id: toSafeString(chapter.chapter_id, `temp_chapter_${index + 1}`),
  title: chapter.title || '未命名章节',
  sort_order: typeof chapter.sort_order === 'number' ? chapter.sort_order : index + 1,
  lessons: Array.isArray(chapter.lessons)
    ? chapter.lessons.map((lesson, lessonIndex) => normalizeLesson(lesson, lessonIndex))
    : [],
});

export const createEmptyDraftContent = (): CourseOutlineDraftContent => ({
  chapters: [],
});

export const normalizeCourseOutlineDraft = (
  draft: Partial<CourseOutlineDraftDto> | null | undefined,
  fallback: Partial<CourseOutlineDraftDto> = {}
): CourseOutlineDraftDto => ({
  course_id: toSafeString(draft?.course_id, toSafeString(fallback.course_id)),
  school_id: toSafeString(draft?.school_id, toSafeString(fallback.school_id)),
  status: typeof draft?.status === 'number'
    ? draft.status
    : typeof fallback.status === 'number'
      ? fallback.status
      : 0,
  chapters: Array.isArray(draft?.chapters)
    ? draft.chapters.map((chapter, index) => normalizeChapter(chapter, index))
    : [],
});

export const reindexCourseOutlineDraft = (draft: CourseOutlineDraftDto): CourseOutlineDraftDto => ({
  ...draft,
  chapters: draft.chapters.map((chapter, chapterIndex) => ({
    ...chapter,
    sort_order: chapterIndex + 1,
    lessons: chapter.lessons.map((lesson, lessonIndex) => ({
      ...lesson,
      sort_order: lessonIndex + 1,
    })),
  })),
});

export const applyPublishIdMappings = (
  draft: CourseOutlineDraftDto,
  idMappings: PublishIdMappingsDto
): CourseOutlineDraftDto => {
  const chapterIdMap = new Map(idMappings.chapters.map((item) => [item.temp_id, item.real_id]));
  const lessonIdMap = new Map(idMappings.lessons.map((item) => [item.temp_id, item.real_id]));

  return {
    ...draft,
    chapters: draft.chapters.map((chapter) => {
      const mappedChapterId = chapterIdMap.get(chapter.chapter_id) || chapter.chapter_id;
      return {
        ...chapter,
        chapter_id: mappedChapterId,
        lessons: chapter.lessons.map((lesson) => ({
          ...lesson,
          lesson_id: lessonIdMap.get(lesson.lesson_id) || lesson.lesson_id,
        })),
      };
    }),
  };
};
