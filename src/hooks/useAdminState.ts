import { useState, useEffect } from 'react';
import { adminContentService } from '../services/db/adminContentService';
import type { DbLevel, DbMethod, DbLesson, DbLessonPart, DbLessonWord } from '../types';

export function useAdminState(role: string | null) {
    // Data State
    const [levels, setLevels] = useState<DbLevel[]>([]);
    const [methods, setMethods] = useState<DbMethod[]>([]);
    const [lessons, setLessons] = useState<DbLesson[]>([]);
    const [parts, setParts] = useState<DbLessonPart[]>([]);
    const [words, setWords] = useState<DbLessonWord[]>([]);

    // Selection State
    const [activeLevel, setActiveLevel] = useState<DbLevel | null>(null);
    const [activeMethod, setActiveMethod] = useState<DbMethod | null>(null);
    const [activeLesson, setActiveLesson] = useState<DbLesson | null>(null);
    const [activePart, setActivePart] = useState<DbLessonPart | null>(null);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue1, setEditValue1] = useState('');
    const [editValue2, setEditValue2] = useState('');

    // Input State
    const [newLevelName, setNewLevelName] = useState('');
    const [newMethodName, setNewMethodName] = useState('');
    const [newLessonName, setNewLessonName] = useState('');

    // Search State
    const [searchQuery, setSearchQuery] = useState(() => {
        if (role !== 'admin') return '';
        const saved = localStorage.getItem('adminPanelState');
        return saved ? (JSON.parse(saved).searchQuery || '') : '';
    });
    const [searchResults, setSearchResults] = useState<any[]>(() => {
        if (role !== 'admin') return [];
        const saved = localStorage.getItem('adminPanelState');
        return saved ? (JSON.parse(saved).searchResults || []) : [];
    });
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (role === 'admin') {
            const savedState = localStorage.getItem('adminPanelState');
            if (savedState) {
                try {
                    const { level, method, lesson, part } = JSON.parse(savedState);
                    if (level || method || lesson || part) {
                        restoreState(level, method, lesson, part);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse saved state", e);
                }
            }
            loadLevels();
        }
    }, [role]);

    useEffect(() => {
        if (role === 'admin') {
            const stateToSave = {
                level: activeLevel,
                method: activeMethod,
                lesson: activeLesson,
                part: activePart,
                searchQuery,
                searchResults
            };
            localStorage.setItem('adminPanelState', JSON.stringify(stateToSave));
        }
    }, [activeLevel, activeMethod, activeLesson, activePart, searchQuery, searchResults, role]);

    const restoreState = async (level: DbLevel | null, method: DbMethod | null, lesson: DbLesson | null, part: DbLessonPart | null) => {
        setIsLoading(true);
        try {
            const promises: Promise<void>[] = [];
            
            promises.push(adminContentService.getLevels().then(d => setLevels(d.sort((a, b) => a.name.localeCompare(b.name)))));
            if (level) {
                setActiveLevel(level);
                promises.push(adminContentService.getMethodsForLevel(level.id).then(d => setMethods(d.sort((a, b) => a.name.localeCompare(b.name)))));
            }
            if (method) {
                setActiveMethod(method);
                promises.push(adminContentService.getLessonsForMethod(method.id).then(d => setLessons(d)));
            }
            if (lesson) {
                setActiveLesson(lesson);
                promises.push(adminContentService.getPartsForLesson(lesson.id).then(d => setParts(d)));
            }
            if (part) {
                setActivePart(part);
                promises.push(adminContentService.getWordsForPart(part.id).then(d => setWords(d)));
            }

            await Promise.all(promises);
        } catch (err: any) {
            console.error("Failed to restore state", err);
            setActiveLevel(null);
            setActiveMethod(null);
            setActiveLesson(null);
            setActivePart(null);
            localStorage.removeItem('adminPanelState');
            loadLevels();
        } finally {
            setIsLoading(false);
        }
    };

    const loadLevels = async () => {
        setIsLoading(true);
        try {
            const data = await adminContentService.getLevels();
            const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
            setLevels(sortedData);
        } catch (err: any) {
            setError('Failed to load levels: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMethodsForLevel = async (level: DbLevel) => {
        setIsLoading(true);
        setActiveLevel(level);
        setActiveMethod(null);
        setActiveLesson(null);
        setActivePart(null);
        setLessons([]);
        setParts([]);
        setWords([]);
        try {
            const data = await adminContentService.getMethodsForLevel(level.id);
            const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
            setMethods(sortedData);
        } catch (err: any) {
            setError('Failed to load methods: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadLessonsForMethod = async (method: DbMethod) => {
        setIsLoading(true);
        setActiveMethod(method);
        setActiveLesson(null);
        setActivePart(null);
        setParts([]);
        setWords([]);
        try {
            const data = await adminContentService.getLessonsForMethod(method.id);
            setLessons(data);
        } catch (err: any) {
            setError('Failed to load lessons: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPartsForLesson = async (lesson: DbLesson) => {
        setIsLoading(true);
        setActiveLesson(lesson);
        setActivePart(null);
        setWords([]);
        try {
            const data = await adminContentService.getPartsForLesson(lesson.id);
            setParts(data);
        } catch (err: any) {
            setError('Failed to load parts: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadWordsForPart = async (part: DbLessonPart) => {
        setIsLoading(true);
        setActivePart(part);
        try {
            const data = await adminContentService.getWordsForPart(part.id);
            setWords(data);
        } catch (err: any) {
            setError('Failed to load words: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLevel = async () => {
        if (!newLevelName.trim()) return;
        try {
            await adminContentService.createLevel(newLevelName.trim());
            setNewLevelName('');
            loadLevels();
        } catch (err: any) {
            setError('Failed to create level: ' + err.message);
        }
    };

    const handleDeleteLevel = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all lessons and parts inside this level.')) return;
        try {
            await adminContentService.deleteLevel(id);
            if (activeLevel?.id === id) setActiveLevel(null);
            loadLevels();
        } catch (err: any) {
            setError('Failed to delete level: ' + err.message);
        }
    };

    const handleCreateMethod = async () => {
        if (!newMethodName.trim() || !activeLevel) return;
        try {
            await adminContentService.createMethod(activeLevel.id, newMethodName.trim());
            setNewMethodName('');
            loadMethodsForLevel(activeLevel);
        } catch (err: any) {
            setError('Failed to create method: ' + err.message);
        }
    };

    const handleDeleteMethod = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all lessons and parts inside this method.')) return;
        try {
            await adminContentService.deleteMethod(id);
            if (activeMethod?.id === id) setActiveMethod(null);
            if (activeLevel) loadMethodsForLevel(activeLevel);
        } catch (err: any) {
            setError('Failed to delete method: ' + err.message);
        }
    };

    const handleCreateLesson = async () => {
        if (!newLessonName.trim() || !activeMethod) return;
        try {
            await adminContentService.createLesson(activeMethod.id, newLessonName.trim());
            setNewLessonName('');
            loadLessonsForMethod(activeMethod);
        } catch (err: any) {
            setError('Failed to create lesson: ' + err.message);
        }
    };

    const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all parts inside this lesson.')) return;
        try {
            await adminContentService.deleteLesson(id);
            if (activeLesson?.id === id) setActiveLesson(null);
            if (activeMethod) loadLessonsForMethod(activeMethod);
        } catch (err: any) {
            setError('Failed to delete lesson: ' + err.message);
        }
    };

    const handleDeletePart = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all words inside this part.')) return;
        try {
            await adminContentService.deletePart(id);
            if (activePart?.id === id) setActivePart(null);
            if (activeLesson) loadPartsForLesson(activeLesson);
        } catch (err: any) {
            setError('Failed to delete part: ' + err.message);
        }
    };

    const handleDeleteWord = async (id: string) => {
        try {
            await adminContentService.deleteWord(id);
            if (activePart) loadWordsForPart(activePart);
        } catch (err: any) {
            setError('Failed to delete word: ' + err.message);
        }
    };

    const handleStartEdit = (id: string, val1: string, val2: string = '', e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingId(id);
        setEditValue1(val1);
        setEditValue2(val2);
    };

    const handleCancelEdit = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingId(null);
        setEditValue1('');
        setEditValue2('');
    };

    const handleSaveLevel = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!editValue1.trim()) return;
        try {
            await adminContentService.updateLevel(id, { name: editValue1.trim() });
            setEditingId(null);
            loadLevels();
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
        }
    };

    const handleSaveLesson = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!editValue1.trim()) return;
        try {
            await adminContentService.updateLesson(id, { name: editValue1.trim() });
            setEditingId(null);
            if (activeMethod) loadLessonsForMethod(activeMethod);
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
        }
    };

    const handleSavePart = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!editValue1.trim()) return;
        try {
            await adminContentService.updatePart(id, { name: editValue1.trim() });
            setEditingId(null);
            if (activeLesson) loadPartsForLesson(activeLesson);
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
        }
    };

    const handleSaveWord = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        let germanText = editValue1.trim();
        let albanianText = editValue2.trim();
        if (!germanText || !albanianText) return;
        
        const updatePayload: any = { german: germanText, albanian: albanianText };
        
        if (germanText.toLowerCase().startsWith('sich ')) {
            updatePayload.is_reflexive = true;
            updatePayload.base = germanText.substring(5).trim();
        }

        try {
            await adminContentService.updateWord(id, updatePayload);
            setEditingId(null);
            
            if (searchResults.length > 0) {
                setSearchResults(prev => prev.map(w => w.id === id ? { ...w, ...updatePayload } : w));
            }
            
            if (activePart) loadWordsForPart(activePart);
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
        }
    };

    const handleGlobalSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setError('');
        try {
            const results = await adminContentService.searchWordsGlobally(searchQuery.trim());
            setSearchResults(results);
            setActiveLevel(null);
            setActiveMethod(null);
            setActiveLesson(null);
            setActivePart(null);
        } catch (err: any) {
            setError('Search failed: ' + err.message);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        loadLevels();
    };

    return {
        levels, methods, lessons, parts, words,
        activeLevel, activeMethod, activeLesson, activePart,
        setActiveLevel, setActiveMethod, setActiveLesson, setActivePart,
        isLoading, error, success, setError, setSuccess,
        editingId, editValue1, editValue2, setEditValue1, setEditValue2,
        newLevelName, setNewLevelName, newMethodName, setNewMethodName, newLessonName, setNewLessonName,
        searchQuery, setSearchQuery, searchResults, setSearchResults, isSearching,
        loadLevels, loadMethodsForLevel, loadLessonsForMethod, loadPartsForLesson, loadWordsForPart,
        handleCreateLevel, handleDeleteLevel, handleCreateMethod, handleDeleteMethod,
        handleCreateLesson, handleDeleteLesson, handleDeletePart, handleDeleteWord,
        handleStartEdit, handleCancelEdit, handleSaveLevel, handleSaveLesson, handleSavePart, handleSaveWord,
        handleGlobalSearch, clearSearch
    };
}
