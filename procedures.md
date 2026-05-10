# Vocabulary Addition Procedure

This document outlines the standard workflow for adding new vocabulary words to the Perkthyesi application. When the user provides a snippet or a list of words (e.g., "These are the new words for lesson 8 for the B2 level"), the AI assistant MUST follow these exact steps to ensure data consistency and accuracy.

## Workflow Steps

### Step 1: Data Extraction & Generation
For each word provided in the snippet/list, the AI must generate the following structured data (aligning with the `DbLessonWord` / `WordPair` types):

1. **Translations**: Provide the accurate and context-appropriate Albanian translation.
2. **Parts of Speech**: Identify the `word_type` (`noun`, `verb`, `adjective`, or `expression`).
3. **Grammar Details** (depending on the word type):
    * **Nouns**: Identify the `base` form, `article` (`der`, `die`, `das`), and `plural` form.
    * **Verbs**: Identify the `base` form, `prateritum` (past tense), `partizip` (past participle), `auxiliary` (`haben`, `sein`), and boolean `is_reflexive`.
    * **Adjectives**: Identify the `base` form, `comparative`, and `superlative` forms.
4. **Multiple-Choice Question (MCQ)**: Generate an MCQ for the word consisting of:
    * `sentence`: A relevant German sentence using the word in context.
    * `sentenceTranslation`: The Albanian translation of the sentence.
    * `options`: 4 options (1 correct, 3 incorrect distractors) in Albanian or German depending on the context.
    * `correctAnswer`: The correct option.

### Step 2: PDF Generation & User Review
Do **NOT** present the generated data as a Markdown table in the chat. Instead, the AI must:
1. Create a local Markdown file containing the structured data (using the table format shown below).
2. Generate a PDF from this Markdown file (e.g., using `npx --yes md-to-pdf filename.md`).
3. Provide the user with the path to the generated PDF (e.g., `A2_Lektion1_Fjalori.pdf`) so they can download and review it.

*Example Review Table Format (for the PDF):*
| German (Base/Article) | Type | Grammar Info (Plural/Forms) | Albanian | MCQ Sentence |
| :--- | :--- | :--- | :--- | :--- |
| das Buch | Noun | Bücher | Libri | Ich lese ein interessantes Buch. |
| gehen | Verb | ging, ist gegangen | Shkoj | Wir gehen heute ins Kino. |

**CRITICAL: Provide the user with the path to the PDF and the SQL file. Wait for the user's explicit approval or requested edits before proceeding or considering the task complete.**

### Step 3: Database Seeding
Once the user approves the generated data:
1. Locate the target Level, Method, Lesson, and Lesson Part in the database to obtain the correct `part_id`.
2. Map the approved data to the `DbLessonWord` structure.
3. Execute the database insertion. Depending on the current setup, this can be done by:
   * Generating and running a Supabase SQL insertion script.
   * Using the application's `adminContentService.ts` via a temporary execution script.
4. Verify the insertion was successful and confirm completion with the user.
