'use client';

import styles from './ProgressStepper.module.css';

interface Step {
    label: string;
    status: 'pending' | 'active' | 'complete' | 'error';
}

interface ProgressStepperProps {
    steps: Step[];
}

export default function ProgressStepper({ steps }: ProgressStepperProps) {
    return (
        <div className={styles.stepper} role="progressbar" aria-label="Analysis progress">
            <div className={styles.steps}>
                {steps.map((step, i) => (
                    <div
                        key={i}
                        className={`${styles.step} ${styles[step.status]}`}
                    >
                        <div className={styles.indicator}>
                            {step.status === 'complete' ? (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : step.status === 'active' ? (
                                <div className={styles.spinner} />
                            ) : step.status === 'error' ? (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M10 6L6 10M6 6L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <span className={styles.stepNumber}>{i + 1}</span>
                            )}
                        </div>
                        <span className={styles.label}>{step.label}</span>
                        {i < steps.length - 1 && <div className={styles.connector} />}
                    </div>
                ))}
            </div>
        </div>
    );
}
