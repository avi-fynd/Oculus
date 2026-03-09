import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDF(elementId: string, filename: string) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Add a temporary class to help style the PDF version
    element.classList.add('pdf-exporting');

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // Allow cross-origin images (like external screenshots)
            logging: false,
            // Adjust width to a fixed standard size like A4 to prevent mobile layout snags when printing
            windowWidth: 1200,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // A4 Dimensions: 210 x 297 mm
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // If content is longer than one page, split it
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(filename);
    } catch (error) {
        console.error('Failed to generate PDF', error);
        alert('Failed to generate PDF. Check console for details.');
    } finally {
        element.classList.remove('pdf-exporting');
    }
}
