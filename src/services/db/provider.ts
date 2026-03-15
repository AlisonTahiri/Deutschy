import type { IDatabaseService } from './IDatabaseService';
import { DexieService } from './DexieService';

let dbServiceInstance: IDatabaseService | null = null;

export const getDbService = (): IDatabaseService => {
    if (!dbServiceInstance) {
        dbServiceInstance = new DexieService();
    }
    return dbServiceInstance;
};

// Export a ready-to-use singleton instance
export const dbService = getDbService();
