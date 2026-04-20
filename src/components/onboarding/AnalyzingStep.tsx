import { useTranslation } from 'react-i18next';
import { aiLoadingKeys } from './constants';

interface AnalyzingStepProps {
    loadingTextIdx: number;
}

export function AnalyzingStep({ loadingTextIdx }: AnalyzingStepProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center gap-10 py-16 animate-[fadeIn_0.4s_ease-out]">
            <div className="relative flex items-center justify-center">
                <div className="absolute w-30 h-30 rounded-full animate-ping opacity-30 bg-(--accent-color)" />
                <div className="absolute w-40 h-40 rounded-full animate-ping opacity-20 bg-(--accent-color) [animation-delay:0.3s]" />
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center text-5xl bg-(--accent-color) shadow-xl shadow-(--accent-color)/30">
                    🍐
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 text-center min-h-[80px]">
                <p key={loadingTextIdx} className="text-xl font-bold animate-[fadeIn_0.4s_ease-out] text-(--text-primary)">
                    {t(aiLoadingKeys[loadingTextIdx])}
                </p>
                <div className="flex gap-2 justify-center">
                    {aiLoadingKeys.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === loadingTextIdx ? 'bg-(--accent-color) scale-150' : 'bg-(--border-color)'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
