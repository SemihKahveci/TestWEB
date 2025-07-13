let currentEvaluationId = null;

function showPDFPopup(id) {
    currentEvaluationId = id;
    document.getElementById('pdfPopup').style.display = 'flex';
    
    // Tüm checkbox'ları seçili yap
    document.getElementById('generalEvaluation').checked = true;
    document.getElementById('strengths').checked = true;
    document.getElementById('interviewQuestions').checked = true;
    document.getElementById('whyTheseQuestions').checked = true;
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
        whyTheseQuestions: document.getElementById('whyTheseQuestions').checked,
        developmentSuggestions: document.getElementById('developmentSuggestions').checked
    };

    fetch(`/api/preview-pdf?code=${currentEvaluationId}&${new URLSearchParams(selectedSections)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('PDF oluşturulurken bir hata oluştu');
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const frame = document.getElementById('pdfPreviewFrame');
            frame.src = url;
            closePDFPopup();
            showPDFPreviewPopup();
        })
        .catch(error => {
            console.error('PDF önizleme hatası:', error);
            alert('PDF önizlenirken bir hata oluştu: ' + error.message);
        });
}

function downloadPDF() {
    const selectedOptions = {
        generalEvaluation: document.getElementById('generalEvaluation').checked,
        strengths: document.getElementById('strengths').checked,
        interviewQuestions: document.getElementById('interviewQuestions').checked,
        whyTheseQuestions: document.getElementById('whyTheseQuestions').checked,
        developmentSuggestions: document.getElementById('developmentSuggestions').checked
    };

    fetch('/api/evaluation/generatePDF', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userCode: currentEvaluationId,
            selectedOptions: selectedOptions
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'PDF oluşturulurken bir hata oluştu'); });
        }
        return response.blob();
    })
    .then(blob => {
        // Kullanıcı bilgilerini al
        return fetch(`/api/user-results?code=${currentEvaluationId}`)
            .then(response => response.json())
            .then(data => {
                if (!data.success || !data.results || data.results.length === 0) {
                    throw new Error('Kullanıcı bilgileri alınamadı');
                }
                
                const user = data.results[0];
                const date = user.completionDate ? new Date(user.completionDate) : new Date();
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${user.name}_${formattedDate}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                closePDFPopup();
            });
    })
    .catch(error => {
        console.error('PDF indirme hatası:', error);
        alert('PDF indirilirken bir hata oluştu: ' + error.message);
    });
} 