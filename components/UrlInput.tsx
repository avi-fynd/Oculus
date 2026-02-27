'use client';

import { useState, useCallback } from 'react';
import styles from './UrlInput.module.css';

interface UrlInputProps {
    onUrlSubmit: (url: string) => void;
    url: string;
    onUrlChange: (url: string) => void;
}

function isValidUrl(str: string): boolean {
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export default function UrlInput({ onUrlSubmit, url, onUrlChange }: UrlInputProps) {
    const [touched, setTouched] = useState(false);
    const isValid = url.length === 0 || isValidUrl(url);
    const showError = touched && url.length > 0 && !isValid;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onUrlChange(e.target.value);
    }, [onUrlChange]);

    const handleBlur = useCallback(() => {
        setTouched(true);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isValidUrl(url)) {
            onUrlSubmit(url);
        }
    }, [url, onUrlSubmit]);

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.inputWrap} ${showError ? styles.hasError : ''}`}>
                <div className={styles.inputIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M8.5 3.5C8.5 3.5 10 2 12.5 2C15 2 17 4 17 6.5C17 9 15.5 10.5 15.5 10.5L10.5 15.5C10.5 15.5 9 17 6.5 17C4 17 2 15 2 12.5C2 10 3.5 8.5 3.5 8.5"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M7 13L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
                <input
                    type="url"
                    className={styles.input}
                    placeholder="https://example.com"
                    value={url}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    aria-label="Website URL to analyze"
                    aria-invalid={showError}
                    aria-describedby={showError ? 'url-error' : undefined}
                    id="url-input"
                    autoComplete="url"
                />
                {url.length > 0 && (
                    <button
                        className={styles.clearBtn}
                        onClick={() => { onUrlChange(''); setTouched(false); }}
                        aria-label="Clear URL"
                        type="button"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
            </div>
            {showError && (
                <p className={styles.error} id="url-error" role="alert">
                    Please enter a valid URL starting with https://
                </p>
            )}
            {url.length > 0 && isValid && (
                <p className={styles.validHint}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4.5 7L6.5 9L9.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Ready to analyze
                </p>
            )}
        </div>
    );
}
