import { useTranslation } from 'react-i18next';
import { Button } from 'konsta/react';
import { UserCircle } from 'lucide-react';

interface WelcomeStepProps {
    onComplete: () => void;
    onNewUser: () => void;
}

export function WelcomeStep({ onComplete, onNewUser }: WelcomeStepProps) {
    const { t } = useTranslation();

    return (
        <div className="animate-[fadeIn_0.4s_ease-out]">
            <div className="flex flex-col items-center text-center gap-4 mb-10">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl bg-(--accent-color) shadow-2xl shadow-(--accent-color)/30">
                    <UserCircle size={48} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold leading-tight text-(--text-primary)">
                    {t('onboarding.welcomeToDeutschy')}
                </h1>
                <p className="text-base text-(--text-secondary) px-4">
                    {t('onboarding.haveAccountDesc')}
                </p>
            </div>

            <div className="flex flex-col gap-4 mb-8">
                <Button
                    large
                    rounded
                    onClick={onComplete}
                    className="bg-(--accent-color) text-white flex items-center justify-center gap-3 h-16 text-lg font-semibold shadow-lg shadow-(--accent-color)/20"
                >
                    {t('onboarding.yesHaveAccount')}
                </Button>
                <Button
                    large
                    rounded
                    outline
                    onClick={onNewUser}
                    className="border-2 border-(--border-color) text-(--text-primary) flex items-center justify-center gap-3 h-16 text-lg font-semibold"
                >
                    {t('onboarding.noNewHere')}
                </Button>
            </div>
        </div>
    );
}
