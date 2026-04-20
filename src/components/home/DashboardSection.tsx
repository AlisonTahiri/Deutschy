import { useTranslation } from 'react-i18next';
import { Block, Progressbar, Button } from 'konsta/react';
import { TrendingUp, Award, BookOpen, Zap, Flame, Play, BarChart2 } from 'lucide-react';
import { MetricCard } from '../MetricCard';
import { getStreak, getTodayXP } from '../../hooks/useProgressManager';

interface DashboardMetrics {
    know: number;
    trying: number;
    avgConfidence: number;
    total: number;
    currentLessonName: string;
    currentLessonProgress: number;
}

interface Props {
    dashboardMetrics: DashboardMetrics;
    lastActivityPath: string | null | undefined;
    onNavigate: (path: string) => void;
}

export function DashboardSection({ dashboardMetrics, lastActivityPath, onNavigate }: Props) {
    const { t } = useTranslation();

    return (
        <Block strong inset className="bg-(--bg-card) border border-(--border-card)">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-(--accent-color)" size={20} />
                <h2 className="m-0 text-lg font-bold">{t('home.yourProgress', { defaultValue: 'Progresi Juaj' })}</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <MetricCard
                    icon={<Award size={12} color="var(--success-color)" />}
                    label={t('home.know')}
                    value={dashboardMetrics.know}
                    accentColor="var(--success-color)"
                    bgStyle={{ background: 'color-mix(in srgb, var(--success-color) 12%, var(--bg-card))' }}
                    tooltip="🏆 Fjalë të zotëruara plotësisht. I keni mësuar mirë nga të dyja anët."
                />
                <MetricCard
                    icon={<BookOpen size={12} />}
                    label={t('home.trying')}
                    value={dashboardMetrics.trying}
                    tooltip="📚 Fjalë në rrjedhje — i keni nisur por s'i keni zotëruar ende."
                />
                <MetricCard
                    icon={<BarChart2 size={12} />}
                    label="% Mesatar"
                    value={`${dashboardMetrics.avgConfidence}%`}
                    accentColor={dashboardMetrics.avgConfidence > 50 ? 'var(--success-color)' : undefined}
                    tooltip="📈 Niveli mesatar i të gjitha fjalëve (0–100%). Synoni të kaloni 80%."
                />
                <MetricCard
                    icon={<Zap size={12} />}
                    label="XP Sot"
                    value={getTodayXP() > 0 ? `+${getTodayXP()}` : '—'}
                    accentColor="var(--accent-color)"
                    tooltip="⚡ Pikë XP të fituara sot. Praktikoni çdo ditë për të mbajtur rrjedhjen."
                />
                <MetricCard
                    icon={<Flame size={12} />}
                    label={t('home.streak')}
                    value={getStreak().count > 0 ? `🔥${getStreak().count}` : '—'}
                    accentColor="var(--warning-color)"
                    tooltip="🔥 Ditë radhazi që keni mësuar. Mos e thyeni serinë!"
                />
                <MetricCard
                    icon={<Play size={12} />}
                    label={t('home.total')}
                    value={dashboardMetrics.total}
                    tooltip="📊 Numri total i fjalëve në të gjitha kurset."
                />
            </div>

            {dashboardMetrics.currentLessonName && lastActivityPath && (
                <div 
                    className="mt-6 p-4 rounded-2xl bg-(--accent-color)/5 border border-(--accent-color)/20 cursor-pointer active:scale-[0.98] transition-all"
                    onClick={() => lastActivityPath && onNavigate(lastActivityPath)}
                >
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">{t('home.activeLesson')}: {dashboardMetrics.currentLessonName}</span>
                            <span className="text-xs mt-1 font-bold" style={{ color: 'var(--success-color)' }}>
                                {dashboardMetrics.know} {t('home.know').toLowerCase()} · {Math.round(dashboardMetrics.currentLessonProgress * 100)}% {t('home.masteryLabel')}
                            </span>
                        </div>
                        <Button 
                            small 
                            rounded 
                            className="w-auto px-3"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (lastActivityPath) onNavigate(lastActivityPath);
                            }}
                        >
                            <Play size={14} className="mr-1" /> {t('common.resume')}
                        </Button>
                    </div>
                    <Progressbar progress={dashboardMetrics.currentLessonProgress} className="h-1.5 rounded-full mt-2" />
                </div>
            )}
        </Block>
    );
}
