import { useTranslation } from 'react-i18next';
import { BlockTitle, List, ListItem, Card } from 'konsta/react';

interface Level {
    id: string;
    name: string;
}

interface Props {
    levels: Level[];
    onSelectLevel: (levelId: string) => void;
}

export function LevelSelection({ levels, onSelectLevel }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <BlockTitle>{t('home.selectLevel')}</BlockTitle>
            {levels.length === 0 ? (
                <Card className="text-center py-10">
                    <p>{t('home.noCourses')}</p>
                </Card>
            ) : (
                <List strong inset dividersIos>
                    {levels.map(level => (
                        <ListItem
                            key={level.id}
                            link
                            title={level.name}
                            onClick={() => onSelectLevel(level.id)}
                            chevron
                        />
                    ))}
                </List>
            )}
        </>
    );
}
