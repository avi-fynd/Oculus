// ─── URL Capture via Puppeteer ────────────────────────────────────────────

import type { DOMAnalysisData } from './audit/index';

interface CaptureResult {
    screenshotBase64: string;
    mobileScreenshotBase64?: string;
    domAnalysis: DOMAnalysisData;
    domSummary: string;
}

export async function captureUrl(url: string): Promise<CaptureResult> {
    // Dynamic import of puppeteer to avoid bundling issues
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
        const page = await browser.newPage();

        // Desktop viewport
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('body', { timeout: 5000 });

        // Take full-page desktop screenshot
        const screenshotBuffer = await page.screenshot({
            fullPage: true,
            type: 'png',
        });
        const screenshotBase64 = Buffer.from(screenshotBuffer).toString('base64');

        // Extract DOM information
        const domAnalysis = await page.evaluate(() => {
            const html = document.documentElement.outerHTML;

            // Images without alt
            const images = Array.from(document.querySelectorAll('img'));
            const imagesWithoutAlt = images.filter((img) => !img.hasAttribute('alt')).length;

            // Inputs without labels
            const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
            const inputsWithoutLabels = inputs.filter((input) => {
                const id = input.id;
                if (id && document.querySelector(`label[for="${id}"]`)) return false;
                if (input.closest('label')) return false;
                if (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')) return false;
                if ((input as HTMLInputElement).type === 'hidden' || (input as HTMLInputElement).type === 'submit' || (input as HTMLInputElement).type === 'button') return false;
                return true;
            }).length;

            // Headings
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            const headingLevels = headings.map((h) => parseInt(h.tagName[1]));

            // Skip link
            const hasSkipLink = !!document.querySelector('a[href="#main-content"], a[href="#content"], a[href="#main"]');

            // Landmarks
            const hasMainLandmark = !!document.querySelector('main, [role="main"]');
            const hasNavLandmark = !!document.querySelector('nav, [role="navigation"]');

            // Counts
            const formCount = document.querySelectorAll('form').length;
            const buttonCount = document.querySelectorAll('button, [role="button"], input[type="submit"]').length;
            const links = Array.from(document.querySelectorAll('a'));
            const linkCount = links.length;
            const ariaLabelsCount = document.querySelectorAll('[aria-label]').length;

            // Navigation info
            const navEl = document.querySelector('nav');
            const navLinks = navEl ? navEl.querySelectorAll('a').length : 0;
            const hasBreadcrumbs = !!document.querySelector('[aria-label*="breadcrumb"], .breadcrumb, .breadcrumbs, nav[aria-label="Breadcrumb"]');
            const hasSearch = !!document.querySelector('input[type="search"], [role="search"], input[placeholder*="search" i]');
            const hasFooterNav = !!document.querySelector('footer nav, footer a');

            // Viewport meta
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            const hasViewportMeta = !!viewportMeta;
            const viewportContent = viewportMeta?.getAttribute('content') || '';
            const textNotScalable = viewportContent.includes('user-scalable=no') ||
                viewportContent.includes('maximum-scale=1');

            // Touch targets (estimate)
            const interactiveEls = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"]'));
            const totalInteractiveElements = interactiveEls.length;
            let smallTouchTargets = 0;
            interactiveEls.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
                    smallTouchTargets++;
                }
            });

            // Color pairs (sample from visible text elements)
            const colorPairs: Array<{ foreground: string; background: string; element: string; fontSize?: number; isBold?: boolean }> = [];
            const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li, td, th, label, button'));
            textElements.slice(0, 20).forEach((el) => {
                const styles = window.getComputedStyle(el);
                colorPairs.push({
                    foreground: styles.color,
                    background: styles.backgroundColor,
                    element: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
                    fontSize: parseFloat(styles.fontSize),
                    isBold: parseInt(styles.fontWeight) >= 700,
                });
            });

            // Text elements for readability
            const readabilityElements = textElements.slice(0, 15).map((el) => {
                const styles = window.getComputedStyle(el);
                const fontSize = parseFloat(styles.fontSize);
                const lineHeight = parseFloat(styles.lineHeight) / fontSize || 1.5;
                const charWidth = fontSize * 0.5;
                const containerWidth = el.getBoundingClientRect().width;
                const lineLength = Math.round(containerWidth / charWidth);
                return {
                    element: el.tagName.toLowerCase(),
                    fontSize,
                    lineHeight: isNaN(lineHeight) ? 1.5 : lineHeight,
                    lineLength,
                };
            });

            // Layout analysis
            const bodyRect = document.body.getBoundingClientRect();
            const horizontalOverflow = document.body.scrollWidth > window.innerWidth;

            return {
                html: html.slice(0, 5000), // Truncate for transport
                colorPairs,
                textElements: readabilityElements,
                domInfo: {
                    html: '',
                    imagesWithoutAlt,
                    inputsWithoutLabels,
                    headingLevels,
                    hasSkipLink,
                    hasMainLandmark,
                    hasNavLandmark,
                    formCount,
                    buttonCount,
                    linkCount,
                    ariaLabelsCount,
                },
                layoutInfo: {
                    hasConsistentSpacing: true,
                    spacingVariance: 0.2,
                    contentDensity: (formCount + buttonCount + linkCount) / (bodyRect.width * bodyRect.height / 1000),
                    hasVisualHierarchy: headings.length > 0 && headingLevels.includes(1),
                    alignmentIssues: [],
                    zIndexLayers: 0,
                },
                mobileInfo: {
                    hasViewportMeta,
                    viewportContent,
                    smallTouchTargets,
                    horizontalOverflow,
                    textNotScalable,
                    totalInteractiveElements,
                },
                navInfo: {
                    hasNav: hasNavLandmark,
                    navLinkCount: navLinks,
                    hasBreadcrumbs,
                    hasSearch,
                    totalLinks: linkCount,
                    hasFooterNav,
                    hasSitemap: false,
                    logoLinksHome: false,
                },
            };
        });

        // Mobile screenshot
        let mobileScreenshotBase64: string | undefined;
        try {
            await page.setViewport({ width: 390, height: 844 });
            await page.waitForSelector('body', { timeout: 3000 });
            const mobileBuffer = await page.screenshot({ fullPage: true, type: 'png' });
            mobileScreenshotBase64 = Buffer.from(mobileBuffer).toString('base64');
        } catch {
            // Mobile screenshot failed, continue without it
        }

        // Build DOM summary for AI
        const domSummary = [
            `Page title: ${await page.title()}`,
            `Images without alt: ${domAnalysis.domInfo?.imagesWithoutAlt}`,
            `Inputs without labels: ${domAnalysis.domInfo?.inputsWithoutLabels}`,
            `Heading levels: ${domAnalysis.domInfo?.headingLevels?.join(', ')}`,
            `Has navigation: ${domAnalysis.navInfo?.hasNav}`,
            `Nav link count: ${domAnalysis.navInfo?.navLinkCount}`,
            `Total links: ${domAnalysis.navInfo?.totalLinks}`,
            `Has viewport meta: ${domAnalysis.mobileInfo?.hasViewportMeta}`,
            `Small touch targets: ${domAnalysis.mobileInfo?.smallTouchTargets}`,
        ].join('\n');

        return {
            screenshotBase64,
            mobileScreenshotBase64,
            domAnalysis: domAnalysis as DOMAnalysisData,
            domSummary,
        };
    } finally {
        await browser.close();
    }
}
