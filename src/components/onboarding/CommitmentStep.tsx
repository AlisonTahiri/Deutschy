import { useTranslation } from 'react-i18next';
import { Block, BlockTitle, List, ListItem, Checkbox, Button } from 'konsta/react';
import { commitmentOptions } from './constants';

interface CommitmentStepProps {
    selectedCommitment: string | null;
    onSelect: (id: string) => void;
    onNext: () => void;
    onBack: () => void;
    canAdvance: boolean;
}

export function CommitmentStep({ 
    selectedCommitment, 
    onSelect, 
    onNext, 
    onBack, 
    canAdvance 
}: CommitmentStepProps) {
    const { t } = useTranslation();

    return (
        <div className="animate-[fadeIn_0.4s_ease-out]">
            <BlockTitle large >{t('onboarding.dailyCommitment')}</BlockTitle>
            <Block className="text-center text-(--text-secondary)">
                {t('onboarding.chooseCommitment')}
            </Block>

            <List strong inset className="m-0 mb-8 overflow-hidden rounded-2xl border-0 shadow-lg">
                {commitmentOptions.map(opt => (
                    <ListItem
                        key={opt.id}
                        link
                        onClick={() => onSelect(opt.id)}
                        title={<span className="font-bold text-lg">{opt.label}</span>}
                        after={<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedCommitment === opt.id ? 'bg-(--accent-color) text-white' : 'bg-gray-200 text-gray-600'}`}>{t(opt.badgeKey)}</span>}
                        subtitle={t(opt.descKey)}
                        media={
                            <Checkbox
                                component="div"
                                checked={selectedCommitment === opt.id}
                                onChange={() => onSelect(opt.id)}
                            />
                        }
                        className="bg-(--bg-card)"
                    />
                ))}
            </List>

            <div className="flex gap-4">
                <Button
                    large
                    rounded
                    outline
                    onClick={onBack}
                    className="flex-1"
                >
                    {t('common.back')}
                </Button>
                <Button
                    large
                    rounded
                    onClick={onNext}
                    disabled={!canAdvance}
                    className="flex-2"
                >
                    {t('common.next')}
                </Button>
            </div>
        </div>
    );
}
