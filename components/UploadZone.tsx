'use client';

import { useState, useRef, useCallback } from 'react';
import styles from './UploadZone.module.css';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    onClear: () => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateAndSetFile = useCallback((file: File) => {
        setError(null);

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError('Please upload a PNG, JPG, or WebP image.');
            return;
        }
        if (file.size > MAX_SIZE) {
            setError('File must be under 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
        onFileSelect(file);
    }, [onFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) validateAndSetFile(file);
    }, [validateAndSetFile]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSetFile(file);
    }, [validateAndSetFile]);

    const handleClear = () => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClear();
    };

    return (
        <div
            className={`${styles.zone} ${isDragging ? styles.dragging : ''} ${selectedFile ? styles.hasFile : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload screenshot for UX analysis"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                }
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className={styles.fileInput}
                aria-hidden="true"
                tabIndex={-1}
                id="screenshot-upload"
            />

            {selectedFile && preview ? (
                <div className={styles.previewContainer}>
                    <div className={styles.previewImageWrap}>
                        <img src={preview} alt="Uploaded screenshot preview" className={styles.previewImage} />
                    </div>
                    <div className={styles.previewInfo}>
                        <span className={styles.fileName}>{selectedFile.name}</span>
                        <span className={styles.fileSize}>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            className={styles.clearBtn}
                            aria-label="Remove uploaded file"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.placeholder}>
                    <div className={styles.iconWrap}>
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.uploadIcon}>
                            <rect x="4" y="4" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                            <path d="M20 14V26M14 20H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <p className={styles.placeholderTitle}>Click to Upload or Drop your UI here</p>
                    {/* <p className={styles.placeholderSub}>
                        or <span className={styles.browseLink}>browse files</span>
                    </p> */}
                    <p className={styles.placeholderHint}>PNG, JPG, or Webp Supported. Max 10MB</p>
                </div>
            )}

            {error && (
                <div className={styles.error} role="alert">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 5V9M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    );
}
