import { useTranslation } from 'react-i18next';
import { Block, BlockTitle, Button } from 'konsta/react';
import { motivationOptions } from './constants';

interface MotivationStepProps {
    selectedMotivation: string | null;
    onSelect: (id: string) => void;
    onNext: () => void;
    onBack: () => void;
    canAdvance: boolean;
}

export function MotivationStep({ 
    selectedMotivation, 
    onSelect, 
    onNext, 
    onBack, 
    canAdvance 
}: MotivationStepProps) {
    const { t } = useTranslation();

    return (
        <div className="animate-[fadeIn_0.4s_ease-out]">
            <BlockTitle large className="text-center px-0">{t('onboarding.whyLearnGerman')}</BlockTitle>
            <Block className="text-center text-(--text-secondary)">
                {t('onboarding.chooseMotivation')}
            </Block>

            <div className="grid grid-cols-2 gap-3 mb-8">
                {motivationOptions.map(opt => (
                    <Button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        outline={selectedMotivation !== opt.id}
                        className={`flex flex-col items-center justify-center gap-3 p-5 h-auto rounded-2xl border-2 transition-all duration-200 ${selectedMotivation === opt.id
                            ? 'border-(--accent-color) bg-(--accent-color)/10'
                            : 'border-(--border-color) bg-(--bg-card)'
                            }`}
                    >
                        <span className="text-3xl">{opt.emoji}</span>
                        <span className={`text-sm font-semibold text-center leading-tight ${selectedMotivation === opt.id ? 'text-(--accent-color)' : 'text-(--text-primary)'}`}>
                            {t(opt.labelKey)}
                        </span>
                    </Button>
                ))}
            </div>

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
