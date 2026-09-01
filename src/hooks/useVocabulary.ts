/**
 * Re-exports the centralized vocabulary hook from VocabularyContext.
 * All vocabulary state is now managed via React Context to avoid
 * redundant Dexie fetches when navigating between pages.
 */
export { useVocabulary } from '../context/VocabularyContext';
