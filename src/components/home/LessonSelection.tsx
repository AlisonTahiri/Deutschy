import { useTranslation } from 'react-i18next';
import { BlockTitle, List, ListItem, Card, Block, Button, Progressbar } from 'konsta/react';
import { calculateProgress } from '../../utils/lessonUtils';
import type { ActiveLesson } from '../../types';

interface Lesson {
    id: string;
    name: string;
    method_id: string;
}

interface Level {
    id: string;
    name: string;
}

interface Props {
    lessonsForLevel: Lesson[];
    allParts: ActiveLesson[];
    activeLevel: Level | undefined;
    onSelectLesson: (lessonId: string) => void;
    onClearAll: () => void;
}

export function LessonSelection({ lessonsForLevel, allParts, activeLevel, onSelectLesson, onClearAll }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <BlockTitle>{t('home.lessonsInLevel', { level: activeLevel?.name })}</BlockTitle>
            {lessonsForLevel.length === 0 ? (
                <Card className="text-center py-10">
                    <p>{t('home.noLessons')}</p>
                    <Button className="mt-4" onClick={onClearAll}>{t('common.backToLevels')}</Button>
                </Card>
            ) : (
                <List strong inset dividersIos>
                    {lessonsForLevel.map(lesson => {
                        const partsForThisLesson = allParts.filter(p => p.lesson_id === lesson.id);
                        const totalWords = partsForThisLesson.reduce((acc, p) => acc + p.words.length, 0);
                        const progress = calculateProgress(partsForThisLesson);

                        return (
                            <ListItem
                                key={lesson.id}
                                link
                                title={lesson.name}
                                subtitle={`${totalWords} ${t('home.words')} total · ${Math.round(progress * 100)}% ${t('home.masteryLabel')}`}
                                onClick={() => onSelectLesson(lesson.id)}
                                chevron
                                footer={
                                    <div className="mt-2">
                                        <Progressbar progress={progress} className="h-1.5" />
                                    </div>
                                }
                            />
                        );
                    })}
                </List>
            )}
            <Block>
                <Button outline onClick={onClearAll}>{t('common.backToLevels')}</Button>
            </Block>
        </>
    );
}
