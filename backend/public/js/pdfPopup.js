let currentEvaluationId = null;

function showPDFPopup(id) {
    currentEvaluationId = id;
    document.getElementById('pdfPopup').style.display = 'flex';
    
    // Tüm checkbox'ları seçili yap
    document.getElementById('generalEvaluation').checked = true;
    document.getElementById('strengths').checked = true;
    document.getElementById('interviewQuestions').checked = true;
    document.getElementById('developmentSuggestions').checked = true;
}

function closePDFPopup() {
    document.getElementById('pdfPopup').style.display = 'none';
}

// PDF Önizleme Popup'ını göster
function showPDFPreviewPopup() {
    const popup = document.getElementById('pdfPreviewPopup');
    popup.style.display = 'flex';
}

// PDF Önizleme Popup'ını kapat
function closePDFPreviewPopup() {
    const popup = document.getElementById('pdfPreviewPopup');
    popup.style.display = 'none';
    const frame = document.getElementById('pdfPreviewFrame');
    frame.src = ''; // iframe'i temizle
}

function previewPDF() {
    const selectedSections = {
        generalEvaluation: document.getElementById('generalEvaluation').checked,
        strengths: document.getElementById('strengths').checked,
        interviewQuestions: document.getElementById('interviewQuestions').checked,
        developmentSuggestions: document.getElementById('developmentSuggestions').checked
    };

    try {
        // PDF'i blob olarak al
        fetch(`/api/preview-pdf?code=${currentEvaluationId}&${new URLSearchParams(selectedSections)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('PDF oluşturulurken bir hata oluştu');
                }
                return response.blob();
            })
            .then(blob => {
                // Blob'u URL'ye dönüştür
                const url = URL.createObjectURL(blob);
                
                // PDF'i iframe'de göster
                const frame = document.getElementById('pdfPreviewFrame');
                if (!frame) {
                    throw new Error('PDF önizleme alanı bulunamadı');
                }
                frame.src = url;
                
                // PDF popup'ını kapat ve önizleme popup'ını aç
                closePDFPopup();
                showPDFPreviewPopup();
            })
            .catch(error => {
                console.error('PDF önizleme hatası:', error);
                alert('PDF önizlenirken bir hata oluştu: ' + error.message);
            });
    } catch (error) {
        console.error('PDF önizleme hatası:', error);
        alert('PDF önizlenirken bir hata oluştu: ' + error.message);
    }
}

async function downloadPDF() {
    const selectedSections = {
        generalEvaluation: document.getElementById('generalEvaluation').checked,
        strengths: document.getElementById('strengths').checked,
        interviewQuestions: document.getElementById('interviewQuestions').checked,
        developmentSuggestions: document.getElementById('developmentSuggestions').checked
    };

    try {
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: currentEvaluationId,
                options: selectedSections
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'PDF oluşturulurken bir hata oluştu');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `degerlendirme_${currentEvaluationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        closePDFPopup();
    } catch (error) {
        console.error('PDF indirme hatası:', error);
        alert('PDF indirilirken bir hata oluştu: ' + error.message);
    }
} 