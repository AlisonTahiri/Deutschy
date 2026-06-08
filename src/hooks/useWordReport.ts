import { supabase } from '../lib/supabase';

export type IssueReport =
    | 'repeated_words'
    | 'wrong_sentence'
    | 'wrong_translation'
    | 'wrong_conjugation'
    | 'other';

export const ISSUE_REPORT_LABELS: Record<IssueReport, string> = {
    repeated_words: '🔁 Fjalë të përsëritura',
    wrong_sentence: '❌ Fjali e gabuar',
    wrong_translation: '🔤 Përkthim i gabuar',
    wrong_conjugation: '📐 Zgjedhim i gabuar',
    other: '❓ Tjetër',
};

export function useWordReport() {
    const reportWord = async (wordId: string, report: IssueReport): Promise<void> => {
        const { error } = await supabase
            .from('lesson_words')
            .update({ has_issues: true, issue_report: report })
            .eq('id', wordId);

        if (error) {
            console.error('Failed to report word', error);
            throw error;
        }
    };

    const unreportWord = async (wordId: string): Promise<void> => {
        const { error } = await supabase
            .from('lesson_words')
            .update({ has_issues: false, issue_report: null })
            .eq('id', wordId);

        if (error) {
            console.error('Failed to unreport word', error);
            throw error;
        }
    };

    return { reportWord, unreportWord };
}
