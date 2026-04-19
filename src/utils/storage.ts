export const StorageKeys = {
    homeViewState: 'deutschy_home_view_state',
    onboardingDone: 'deutschy_onboarding_done',
    userRole: 'deutschy_user_role',
    session: (lessonId: string) => `session_${lessonId}`,
    flashcards: (lessonId: string) => `flashcards_${lessonId}`,
} as const;

export function cleanupLessonStorage(lessonId: string): void {
    localStorage.removeItem(StorageKeys.session(lessonId));
    localStorage.removeItem(StorageKeys.flashcards(lessonId));
}
