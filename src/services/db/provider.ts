import { Capacitor } from '@capacitor/core';
import type { IDatabaseService } from './IDatabaseService';
import { DexieService } from './DexieService';
import { CapacitorSQLiteService } from './CapacitorSQLiteService';

let dbServiceInstance: IDatabaseService | null = null;

export const getDbService = (): IDatabaseService => {
    if (!dbServiceInstance) {
        if (Capacitor.isNativePlatform()) {
            dbServiceInstance = new CapacitorSQLiteService();
        } else {
            dbServiceInstance = new DexieService();
        }
    }
    return dbServiceInstance;
};

// Export a ready-to-use singleton instance
export const dbService = getDbService();
