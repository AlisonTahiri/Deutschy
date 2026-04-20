import { useTranslation } from 'react-i18next';
import { BlockTitle, Card, Block, Button, Progressbar } from 'konsta/react';
import { Play, RotateCcw } from 'lucide-react';
import { calculateProgress } from '../../utils/lessonUtils';
import type { ActiveLesson } from '../../types';

interface Lesson {
    id: string;
    name: string;
    method_id: string;
}

interface Props {
    partsForLesson: ActiveLesson[];
    activeLesson: Lesson | undefined;
    onClearToLevel: () => void;
    onNavigate: (path: string) => void;
}

export function LessonPartsSelection({ partsForLesson, activeLesson, onClearToLevel, onNavigate }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <BlockTitle>{t('home.lesson')} {activeLesson?.name}</BlockTitle>
            <Block strong inset className="bg-(--bg-accent-subtle)">
                <p className="m-0 text-sm">
                    {t('home.containsInfo', { 
                        total: partsForLesson.reduce((acc, p) => acc + p.words.length, 0), 
                        count: partsForLesson.length 
                    })}
                </p>
            </Block>

            <BlockTitle>{t('home.lessonParts')}</BlockTitle>
            {partsForLesson.length === 0 ? (
                <Card className="text-center py-10">
                    <p>{t('home.noParts')}</p>
                </Card>
            ) : (
                <Block className="px-4!">
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {partsForLesson.map(part => {
                            const totalCount = part.words.length;
                            const progress = calculateProgress([part]);

                            return (
                                <Card key={part.id} className="m-0 bg-(--bg-card)">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-row justify-between items-start">
                                            <h4 className="m-0 text-lg font-bold">{part.part_name}</h4>
                                            <Button
                                                small
                                                rounded
                                                onClick={() => onNavigate(`/exercise/${part.id}`)}
                                                disabled={totalCount === 0}
                                                className="w-auto px-4"
                                            >
                                                {progress === 0 ? (
                                                    <><Play size={16} className="mr-1" /> {t('common.start')}</>
                                                ) : progress >= 1 ? (
                                                    <><RotateCcw size={16} className="mr-1" /> {t('common.tryAgain', { defaultValue: 'Rishiko' })}</>
                                                ) : (
                                                    <><Play size={16} className="mr-1" /> {t('common.resume')}</>
                                                )}
                                            </Button>
                                        </div>
                                        <div>
                                            <Progressbar progress={progress} className="h-2 mb-2 rounded-full" />
                                            <div className="flex flex-row justify-between text-xs text-(--text-secondary)">
                                                <span>{totalCount} {t('home.words')}</span>
                                                <span>{Math.round(progress * 100)}% {t('home.mastered')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </Block>
            )}
            <Block className="mt-4">
                <Button outline onClick={onClearToLevel}>{t('common.backToLessons')}</Button>
            </Block>
        </>
    );
}
