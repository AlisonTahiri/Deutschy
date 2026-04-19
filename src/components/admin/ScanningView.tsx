import { ImageIcon, Loader2, FileText, Check, Trash2 } from 'lucide-react';
import { glassPanel, btnPrimary, btnSecondary, btnSubtle } from './AdminLayout';

interface ScanningViewProps {
    isUploading: boolean;
    scanProgress: number;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showConflictModal: boolean;
    setShowConflictModal: (show: boolean) => void;
    handleConfirmConflict: (keepExisting: boolean) => void;
    setPendingImageFile: (file: File | null) => void;
}

export function ScanningView({
    isUploading,
    scanProgress,
    fileInputRef,
    handleImageUpload,
    showConflictModal,
    setShowConflictModal,
    handleConfirmConflict,
    setPendingImageFile
}: ScanningViewProps) {
    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
            <div className={`${glassPanel} flex flex-col sm:flex-row justify-between items-center gap-4`}>
                <div className="flex flex-col">
                    <h3 className="m-0 text-lg font-bold">Vocabulary Scanning</h3>
                    <p className="m-0 text-sm text-(--text-secondary)">Upload image to automatically generate and distribute words into parts.</p>
                </div>
                <div className="flex flex-row gap-3 w-full sm:w-auto">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />
                    <button
                        className={`${btnPrimary} flex-1 sm:flex-none py-3! px-6!`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                        {isUploading ? 'Scanning...' : 'Scan Image with AI'}
                    </button>
                </div>
            </div>

            {isUploading && (
                <div className={`${glassPanel} flex flex-col gap-3 py-6`}>
                    <div className="flex flex-row justify-between items-center">
                        <span className="text-sm">Extracting vocabulary...</span>
                        <span className="text-sm text-(--text-secondary)">{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="w-full bg-(--bg-color) h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-(--accent-color) transition-all duration-500 ease-out" style={{ width: `${scanProgress}%` }} />
                    </div>
                </div>
            )}

            {showConflictModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className={`${glassPanel} max-w-md w-full flex flex-col gap-6 animate-[slideUp_0.3s_ease-out]`}>
                        <div className="flex flex-col gap-2">
                            <h2 className="m-0 text-xl font-bold flex items-center gap-2">
                                <FileText className="text-(--accent-color)" />
                                Leksioni ka fjalë ekzistuese
                            </h2>
                            <p className="m-0 text-sm text-(--text-secondary)">
                                A dëshironi t'i mbani fjalët ekzistuese të këtij leksioni, apo dëshironi t'i zëvendësoni me fjalët e reja të imazhit?
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                className={`${btnPrimary} w-full py-3! justify-start px-5!`}
                                onClick={() => handleConfirmConflict(true)}
                            >
                                <Check size={18} />
                                Po, mbaj fjalët ekzistuese
                            </button>
                            <button
                                className={`${btnSecondary} w-full py-3! hover:bg-(--danger-color)/10 hover:border-(--danger-color)/30 hover:text-(--danger-color) justify-start px-5!`}
                                onClick={() => handleConfirmConflict(false)}
                            >
                                <Trash2 size={18} />
                                Jo, fshij fjalët ekzistuese
                            </button>
                            <button
                                className={`${btnSubtle} w-full mt-2`}
                                onClick={() => {
                                    setShowConflictModal(false);
                                    setPendingImageFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            >
                                Anulo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
