import styles from './Landing.module.css';
import Logo from './ui/Logo';

export function BentoGrid() {
    return (
        <section className={styles.bentoSection}>
            <h2 className={styles.sectionTitle}>What Oculus Offers</h2>
            <div className={styles.bentoGrid}>
                <div className={`${styles.bentoBox} ${styles.bentoHalf}`}>
                    <div className={styles.bentoIconWrapper}>
                        <img src="/Get UX Audit Score.svg" alt="Get UX Audit Score" className={styles.bentoIcon} />
                    </div>
                    <h3>Get UX Audit Score</h3>
                    <p>Instantly identify critical issues like contrast ratio failures, readability issues, cognitive overload and more. Get precise category wise details and visual evidence.</p>
                </div>
                <div className={`${styles.bentoBox} ${styles.bentoHalf}`}>
                    <div className={styles.bentoIconWrapper}>
                        <img src="/Powered by ChatGPT.svg" alt="Powered by ChatGPT" className={styles.bentoIcon} />
                    </div>
                    <h3>Powered by ChatGPT</h3>
                    <p>Get AI-driven deep analysis and actionable recommendations for every identified usability flaw, powered by OpenAI's latest model.</p>
                </div>
                <div className={`${styles.bentoBox} ${styles.bentoThird}`}>
                    <div className={styles.bentoIconWrapper}>
                        <img src="/Research-Backed Evaluation.svg" alt="Research-Backed Evaluation" className={styles.bentoIcon} />
                    </div>
                    <h3>Research-Backed Evaluation</h3>
                    <p>Oculus measures against Nielsen's Laws, WCAG 2.2, Laws of UX, and even Baymard's UX guidelines.</p>
                </div>
                <div className={`${styles.bentoBox} ${styles.bentoThird}`}>
                    <div className={styles.bentoIconWrapper}>
                        <img src="/Realtime Interactive Analysis.svg" alt="Realtime Interactive Analysis" className={styles.bentoIcon} />
                    </div>
                    <h3>Realtime Interactive Analysis</h3>
                    <p>Whether you upload a screenshot or paste a URL, we navigate and parse the DOM in seconds.</p>
                </div>
                <div className={`${styles.bentoBox} ${styles.bentoThird}`}>
                    <div className={styles.bentoIconWrapper}>
                        <img src="/Downloadable PDF Reports.svg" alt="Downloadable PDF Reports" className={styles.bentoIcon} />
                    </div>
                    <h3>Downloadable PDF Reports</h3>
                    <p>Share professional, branded UX audit PDFs with clients or your engineering team in one click. Fully compliant and mobile-first.</p>
                </div>
            </div>
        </section>
    );
}

export function UxLawsSection() {
    const laws = [
        { title: "Fitts's Law", desc: "The time to acquire a target is a function of the distance to and size of the target." },
        { title: "Hick's Law", desc: "The time it takes to make a decision increases with the number and complexity of choices." },
        { title: "Jakob's Law", desc: "Users spend most of their time on other sites, so they expect yours to work the same way." },
        { title: "Cognitive Load", desc: "When the amount of information exceeds the space we have available, we struggle mentally to keep up" },
        { title: "Law of Proximity", desc: "Objects that are near, or proximate to each other, tend to be grouped together." },
        { title: "Law of Similarity", desc: "The human eye tends to perceive similar elements as a complete picture, shape, or group." },
        { title: "Gestalt Principles", desc: "Proximity, Similarity, and Alignment all together needed to create visual hierarchy." },
        { title: "Nielsen's 10 Heuristics", desc: "Visibility of system status, match between system and the real world, and more." },
        { title: "WCAG 2.2", desc: "Contrast minimums, keyboard accessibility, screen reader compatibility, and more." },
    ];

    return (
        <section className={styles.lawsSection}>
            <h2 className={styles.sectionTitle}>Evaluating 10+ Foundational UX Laws</h2>
            <div className={styles.lawsGrid}>
                {laws.map((law, i) => (
                    <div key={i} className={styles.lawCard}>
                        <div className={styles.lawIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h4>{law.title}</h4>
                        <p>{law.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div className={styles.footerBrand}>
                    <Logo style={{ marginBottom: '16px' }} />
                    <p className={styles.footerSub}>Scan once and let AI do the rest</p>
                </div>
                <div className={styles.footerLinks}>
                    <div className={styles.footerGroup}>
                        <span>Stay Updated</span>
                        <div className={styles.subscribeForm}>
                            <input type="email" placeholder="Enter your email" className={styles.subInput} />
                            <button className={styles.subBtn}>Subscribe</button>
                        </div>
                    </div>
                    <div className={styles.footerGroup}>
                        <span>Social</span>
                        <div className={styles.socialIcons}>
                            <a href="#" aria-label="LinkedIn">LinkedIn</a>
                            <a href="#" aria-label="X (Twitter)">X / Twitter</a>
                            <a href="#" aria-label="Instagram">Instagram</a>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.footerBottom}>
                <p>© {new Date().getFullYear()} Avijeet Shrivastava. All rights reserved.</p>
            </div>
        </footer>
    );
}
