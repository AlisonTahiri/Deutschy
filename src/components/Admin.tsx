import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { Loader2, Flag } from 'lucide-react';

// Hooks
import { useAdminState } from '../hooks/useAdminState';
import { useAdminAI } from '../hooks/useAdminAI';

// Components
import { AdminBreadcrumbs } from './admin/AdminBreadcrumbs';
import { GlobalSearch } from './admin/GlobalSearch';
import { LevelList, MethodList, LessonList, PartList } from './admin/AdminViews';
import { ScanningView } from './admin/ScanningView';
import { VocabularyView } from './admin/VocabularyView';
import { SearchResultsView } from './admin/SearchResultsView';
import { IssuesView } from './admin/IssuesView';

export function Admin() {
    const { role } = useAuth();
    const { settings, updateLevel } = useSettings();
    const [showIssues, setShowIssues] = useState(false);

    const state = useAdminState(role);
    
    const ai = useAdminAI({
        settings,
        activeLesson: state.activeLesson,
        activePart: state.activePart,
        words: state.words,
        setError: state.setError,
        setSuccess: state.setSuccess,
        loadPartsForLesson: state.loadPartsForLesson,
        loadWordsForPart: state.loadWordsForPart,
        setActivePart: state.setActivePart
    });

    if (role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-(--text-secondary)">You do not have permission to view the Admin Dashboard.</p>
            </div>
        );
    }

    return (
        <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-8 pb-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="m-0 text-3xl font-bold">Content Administration</h1>
                    <p className="text-(--text-secondary)">Manage course structure and learning materials synchronized via Supabase.</p>
                </div>
                <button
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border font-semibold text-sm cursor-pointer transition-all"
                    style={{
                        borderColor: showIssues || state.wordsWithIssues.length > 0 ? 'var(--danger-color)' : 'var(--border-color)',
                        color: showIssues || state.wordsWithIssues.length > 0 ? 'var(--danger-color)' : 'var(--text-secondary)',
                        background: showIssues ? 'color-mix(in srgb, var(--danger-color) 10%, var(--bg-card))' : 'var(--bg-card)',
                    }}
                    onClick={() => {
                        setShowIssues(v => !v);
                        if (!showIssues) state.loadWordsWithIssues();
                    }}
                >
                    <Flag size={15} fill={state.wordsWithIssues.length > 0 ? 'currentColor' : 'none'} />
                    Issues
                    {state.wordsWithIssues.length > 0 && (
                        <span style={{
                            background: 'var(--danger-color)', color: '#fff',
                            borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700,
                            padding: '1px 6px', minWidth: 18, textAlign: 'center',
                        }}>
                            {state.wordsWithIssues.length}
                        </span>
                    )}
                </button>
            </div>

            {state.error && <div className="text-(--danger-color) p-3 bg-(--danger-color)/10 border border-(--danger-color)/20 rounded-xl text-sm animate-[fadeIn_0.3s_ease-out]">{state.error}</div>}
            {state.success && <div className="text-(--success-color) p-3 bg-(--success-color)/10 border border-(--success-color)/20 rounded-xl text-sm animate-[fadeIn_0.3s_ease-out]">{state.success}</div>}

            <GlobalSearch 
                searchQuery={state.searchQuery}
                setSearchQuery={state.setSearchQuery}
                handleGlobalSearch={state.handleGlobalSearch}
                clearSearch={state.clearSearch}
                isSearching={state.isSearching}
            />

            <AdminBreadcrumbs 
                activeLevel={state.activeLevel}
                activeMethod={state.activeMethod}
                activeLesson={state.activeLesson}
                activePart={state.activePart}
                setActiveLevel={state.setActiveLevel}
                setActiveMethod={state.setActiveMethod}
                setActiveLesson={state.setActiveLesson}
                setActivePart={state.setActivePart}
            />

            {state.isLoading && !ai.isUploading && (
                <div className="text-center py-8"><Loader2 className="animate-spin" size={32} color="var(--accent-color)" /></div>
            )}

            {/* VIEW: LEVELS */}
            {!state.activeLevel && !state.isLoading && (
                <LevelList 
                    levels={state.levels}
                    newLevelName={state.newLevelName}
                    setNewLevelName={state.setNewLevelName}
                    handleCreateLevel={state.handleCreateLevel}
                    handleSaveLevel={state.handleSaveLevel}
                    handleDeleteLevel={state.handleDeleteLevel}
                    loadMethodsForLevel={state.loadMethodsForLevel}
                    editingId={state.editingId}
                    editValue1={state.editValue1}
                    setEditValue1={state.setEditValue1}
                    handleStartEdit={state.handleStartEdit}
                    handleCancelEdit={state.handleCancelEdit}
                />
            )}

            {/* VIEW: METHODS */}
            {state.activeLevel && !state.activeMethod && !state.isLoading && (
                <MethodList 
                    methods={state.methods}
                    newMethodName={state.newMethodName}
                    setNewMethodName={state.setNewMethodName}
                    handleCreateMethod={state.handleCreateMethod}
                    handleDeleteMethod={state.handleDeleteMethod}
                    loadLessonsForMethod={state.loadLessonsForMethod}
                />
            )}

            {/* VIEW: LESSONS */}
            {state.activeMethod && !state.activeLesson && !state.isLoading && (
                <LessonList 
                    lessons={state.lessons}
                    newLessonName={state.newLessonName}
                    setNewLessonName={state.setNewLessonName}
                    handleCreateLesson={state.handleCreateLesson}
                    handleSaveLesson={state.handleSaveLesson}
                    handleDeleteLesson={state.handleDeleteLesson}
                    loadPartsForLesson={state.loadPartsForLesson}
                    editingId={state.editingId}
                    editValue1={state.editValue1}
                    setEditValue1={state.setEditValue1}
                    handleStartEdit={state.handleStartEdit}
                    handleCancelEdit={state.handleCancelEdit}
                />
            )}

            {/* VIEW: SCANNING & PARTS */}
            {state.activeLesson && !state.activePart && !state.isLoading && (
                <div className="flex flex-col gap-4">
                    <ScanningView 
                        isUploading={ai.isUploading}
                        scanProgress={ai.scanProgress}
                        fileInputRef={ai.fileInputRef}
                        handleImageUpload={ai.handleImageUpload}
                        showConflictModal={ai.showConflictModal}
                        setShowConflictModal={ai.setShowConflictModal}
                        handleConfirmConflict={ai.handleConfirmConflict}
                        setPendingImageFile={ai.setPendingImageFile}
                    />
                    <PartList 
                        parts={state.parts}
                        handleSavePart={state.handleSavePart}
                        handleDeletePart={state.handleDeletePart}
                        loadWordsForPart={state.loadWordsForPart}
                        editingId={state.editingId}
                        editValue1={state.editValue1}
                        setEditValue1={state.setEditValue1}
                        handleStartEdit={state.handleStartEdit}
                        handleCancelEdit={state.handleCancelEdit}
                    />
                </div>
            )}

            {/* VIEW: WORDS (VOCABULARY) */}
            {state.activePart && !state.isLoading && (
                <VocabularyView 
                    words={state.words}
                    settings={settings}
                    updateLevel={updateLevel}
                    isGeneratingMCQs={ai.isGeneratingMCQs}
                    handleGenerateMCQs={ai.handleGenerateMCQs}
                    handleStopGeneration={ai.handleStopGeneration}
                    handleResetAndRegenerateMCQs={ai.handleResetAndRegenerateMCQs}
                    mcqProgressText={ai.mcqProgressText}
                    isRescanning={ai.isRescanning}
                    rescanProgress={ai.rescanProgress}
                    handleRescanWords={ai.handleRescanWords}
                    editingId={state.editingId}
                    editValue1={state.editValue1}
                    editValue2={state.editValue2}
                    setEditValue1={state.setEditValue1}
                    setEditValue2={state.setEditValue2}
                    handleStartEdit={state.handleStartEdit}
                    handleCancelEdit={state.handleCancelEdit}
                    handleSaveWord={state.handleSaveWord}
                    handleDeleteWord={state.handleDeleteWord}
                />
            )}

            {/* VIEW: SEARCH RESULTS */}
            {state.searchResults.length > 0 && !state.activeLevel && !state.activePart && !state.isLoading && (
                <SearchResultsView 
                    searchResults={state.searchResults}
                    setSearchResults={state.setSearchResults}
                    editingId={state.editingId}
                    editValue1={state.editValue1}
                    editValue2={state.editValue2}
                    setEditValue1={state.setEditValue1}
                    setEditValue2={state.setEditValue2}
                    handleStartEdit={state.handleStartEdit}
                    handleCancelEdit={state.handleCancelEdit}
                    handleSaveWord={state.handleSaveWord}
                    handleDeleteWord={state.handleDeleteWord}
                />
            )}

            {/* VIEW: ISSUES */}
            {showIssues && (
                <IssuesView
                    wordsWithIssues={state.wordsWithIssues as any}
                    isLoadingIssues={state.isLoadingIssues}
                    loadWordsWithIssues={state.loadWordsWithIssues}
                    unreportWord={state.unreportWord}
                    editingId={state.editingId}
                    editValue1={state.editValue1}
                    editValue2={state.editValue2}
                    setEditValue1={state.setEditValue1}
                    setEditValue2={state.setEditValue2}
                    handleStartEdit={state.handleStartEdit}
                    handleCancelEdit={state.handleCancelEdit}
                    handleSaveWord={state.handleSaveWord}
                />
            )}
        </div>
    );
}
