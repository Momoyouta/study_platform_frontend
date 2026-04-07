import { Layout } from 'antd';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Question, QuestionType } from '@/store/homework';
import { TYPE_NAMES } from '../constants';

const { Sider } = Layout;

type GroupItem = { question: Question; index: number };

type QuestionIndexSiderProps = {
    questions: Question[];
    activeQuestionIndex: number;
    isTeacherMode: boolean;
    isPublished: boolean;
    withStudentResultSummary?: boolean;
    userAnswers: Record<string, any>;
    onQuestionSelect: (index: number) => void;
    onTeacherDragEnd?: (event: DragEndEvent) => void;
};

const SortableQuestionGridItem = ({
    id,
    title,
    isActive,
    isAnswered,
    disabled,
    onClick,
}: {
    id: string;
    title: number;
    isActive: boolean;
    isAnswered: boolean;
    disabled: boolean;
    onClick: () => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`question-grid-item ${isActive ? 'active' : ''} ${isAnswered ? 'answered' : ''} ${
                disabled ? 'drag-disabled' : ''
            }`}
            onClick={onClick}
            {...attributes}
            {...listeners}
        >
            {title}
        </div>
    );
};

const QuestionIndexSider = ({
    questions,
    activeQuestionIndex,
    isTeacherMode,
    isPublished,
    withStudentResultSummary = false,
    userAnswers,
    onQuestionSelect,
    onTeacherDragEnd,
}: QuestionIndexSiderProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
            },
        }),
    );

    const groupedQuestions = questions.reduce((acc, question, index) => {
        if (!acc[question.type]) {
            acc[question.type] = [];
        }
        acc[question.type].push({ question, index });
        return acc;
    }, {} as Record<QuestionType, GroupItem[]>);

    const renderGroups = () => {
        return Object.entries(groupedQuestions).map(([type, items], groupIdx) => {
            const typedType = type as QuestionType;
            const groupTitleNum = ['一', '二', '三', '四', '五', '六'][groupIdx];
            const totalScore = items.reduce((sum, item) => sum + item.question.score, 0);
            const sortableIds = items.map((item) => item.question.id);

            return (
                <div key={typedType} className="question-group">
                    <div className="group-title">
                        {groupTitleNum}、{TYPE_NAMES[typedType]} ({totalScore}分)
                    </div>
                    {isTeacherMode ? (
                        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
                            <div className="group-grid">
                                {items.map((item) => {
                                    const isActive = activeQuestionIndex === item.index;
                                    const isAnswered = Boolean(
                                        item.question.referenceAnswer ||
                                            item.question.analysis ||
                                            item.question.questionImages?.length ||
                                            item.question.analysisImages?.length,
                                    );

                                    return (
                                        <SortableQuestionGridItem
                                            key={item.question.id}
                                            id={item.question.id}
                                            title={item.index + 1}
                                            isActive={isActive}
                                            isAnswered={isAnswered}
                                            disabled={isPublished}
                                            onClick={() => onQuestionSelect(item.index)}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    ) : (
                        <div className="group-grid">
                            {items.map((item) => {
                                const isActive = activeQuestionIndex === item.index;
                                const isAnswered = userAnswers[item.question.id] !== undefined;

                                return (
                                    <div
                                        key={item.question.id}
                                        className={`question-grid-item ${isActive ? 'active' : ''} ${
                                            isAnswered ? 'answered' : ''
                                        }`}
                                        onClick={() => onQuestionSelect(item.index)}
                                    >
                                        {item.index + 1}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        });
    };

    const content = <div className="question-index-container">{renderGroups()}</div>;

    return (
        <Sider
            width={280}
            className={`homework-index-sider ${withStudentResultSummary ? 'with-student-result-summary' : ''}`}
            theme="light"
        >
            {isTeacherMode ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onTeacherDragEnd || (() => {})}>
                    {content}
                </DndContext>
            ) : (
                content
            )}
        </Sider>
    );
};

export default QuestionIndexSider;
