// ==================== FORM STATE MANAGEMENT ====================
const formState = {
    approvedArticles: new Set(),
    formData: {}
};

// ==================== DOM ELEMENTS ====================
const form = document.getElementById('kvkkForm');
const approveButtons = document.querySelectorAll('.approve-btn');
const downloadBtn = document.getElementById('downloadBtn');
const approvalCountSpan = document.getElementById('approvalCount');
const summaryText = document.getElementById('summaryText');
const fullNameInput = document.getElementById('fullName');
const tcNoInput = document.getElementById('tcNo');
const addressInput = document.getElementById('address');
const formDateInput = document.getElementById('formDate');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setTodayDate();
});

function initializeForm() {
    // Load saved form data from localStorage if available
    const savedData = localStorage.getItem('kvkkFormData');
    if (savedData) {
        const data = JSON.parse(savedData);
        formState.formData = data.formData;
        formState.approvedArticles = new Set(data.approvedArticles);
        restoreFormState();
    }
}

function setTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    formDateInput.value = `${year}-${month}-${day}`;
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Approve buttons
    approveButtons.forEach(button => {
        button.addEventListener('click', handleApproveClick);
    });

    // Download button
    downloadBtn.addEventListener('click', handleDownload);

    // Form inputs
    fullNameInput.addEventListener('change', saveFormData);
    tcNoInput.addEventListener('change', saveFormData);
    addressInput.addEventListener('change', saveFormData);
    formDateInput.addEventListener('change', saveFormData);

    // Form reset
    form.addEventListener('reset', handleFormReset);

    // TC No validation
    tcNoInput.addEventListener('input', validateTCNo);
}

// ==================== FORM DATA MANAGEMENT ====================
function saveFormData() {
    formState.formData = {
        fullName: fullNameInput.value,
        tcNo: tcNoInput.value,
        address: addressInput.value,
        formDate: formDateInput.value
    };
    
    // Save to localStorage
    const dataToSave = {
        formData: formState.formData,
        approvedArticles: Array.from(formState.approvedArticles)
    };
    localStorage.setItem('kvkkFormData', JSON.stringify(dataToSave));
}

function restoreFormState() {
    if (formState.formData.fullName) fullNameInput.value = formState.formData.fullName;
    if (formState.formData.tcNo) tcNoInput.value = formState.formData.tcNo;
    if (formState.formData.address) addressInput.value = formState.formData.address;
    if (formState.formData.formDate) formDateInput.value = formState.formData.formDate;

    // Restore approved articles UI
    formState.approvedArticles.forEach(articleNum => {
        const button = document.querySelector(`.approve-btn[data-article="${articleNum}"]`);
        if (button) {
            markArticleAsApproved(button, articleNum);
        }
    });

    updateApprovalStatus();
}

function handleFormReset() {
    // Clear localStorage
    localStorage.removeItem('kvkkFormData');
    
    // Clear form state
    formState.approvedArticles.clear();
    formState.formData = {};

    // Reset approve buttons
    approveButtons.forEach(button => {
        button.classList.remove('approved');
        button.textContent = 'ONAYLIYORUM';
    });

    // Reset article containers
    document.querySelectorAll('.article-container').forEach(container => {
        container.classList.remove('approved');
    });

    // Reset date to today
    setTodayDate();

    // Update UI
    updateApprovalStatus();
}

// ==================== APPROVAL HANDLING ====================
function handleApproveClick(event) {
    event.preventDefault();
    const button = event.target;
    const articleNum = button.getAttribute('data-article');

    if (formState.approvedArticles.has(articleNum)) {
        // Already approved, toggle to unapprove
        formState.approvedArticles.delete(articleNum);
        button.classList.remove('approved');
        button.textContent = 'ONAYLIYORUM';
        button.parentElement.classList.remove('approved');
    } else {
        // Not approved, approve it
        markArticleAsApproved(button, articleNum);
    }

    saveFormData();
    updateApprovalStatus();
}

function markArticleAsApproved(button, articleNum) {
    formState.approvedArticles.add(articleNum);
    button.classList.add('approved');
    button.parentElement.classList.add('approved');
    
    // Add animation
    animateApproval(button);
}

function animateApproval(button) {
    // Add a visual feedback animation
    const originalBg = button.style.background;
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 100);
}

// ==================== APPROVAL STATUS UPDATE ====================
function updateApprovalStatus() {
    const approvedCount = formState.approvedArticles.size;
    const totalArticles = 11;
    
    approvalCountSpan.textContent = approvedCount;

    // Update summary text
    if (approvedCount === 0) {
        summaryText.textContent = 'Lütfen tüm maddeleri okuyup onaylayınız.';
        downloadBtn.disabled = true;
    } else if (approvedCount < totalArticles) {
        summaryText.textContent = `${totalArticles - approvedCount} madde daha onaylanmalıdır.`;
        downloadBtn.disabled = true;
    } else {
        summaryText.textContent = '✓ Tüm maddeler onaylanmıştır. PDF indirebilirsiniz.';
        downloadBtn.disabled = false;
    }

    // Update button color based on completion
    const percentage = (approvedCount / totalArticles) * 100;
    if (percentage === 100) {
        approvalCountSpan.style.color = '#4CAF50';
    } else if (percentage >= 50) {
        approvalCountSpan.style.color = '#FF9800';
    } else {
        approvalCountSpan.style.color = '#004C97';
    }
}

// ==================== VALIDATION ====================
function validateTCNo(event) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    event.target.value = value;
}

function validateForm() {
    let isValid = true;
    const errors = [];

    // Check required fields
    if (!fullNameInput.value.trim()) {
        errors.push('Adı Soyadı boş bırakılamaz.');
        isValid = false;
    }

    if (!tcNoInput.value.trim()) {
        errors.push('T.C. Kimlik No boş bırakılamaz.');
        isValid = false;
    } else if (tcNoInput.value.length !== 11) {
        errors.push('T.C. Kimlik No 11 haneli olmalıdır.');
        isValid = false;
    } else if (!/^[0-9]{11}$/.test(tcNoInput.value)) {
        errors.push('T.C. Kimlik No sadece rakamlardan oluşmalıdır.');
        isValid = false;
    }

    if (!addressInput.value.trim()) {
        errors.push('Adres boş bırakılamaz.');
        isValid = false;
    }

    if (!formDateInput.value) {
        errors.push('Tarih boş bırakılamaz.');
        isValid = false;
    }

    if (formState.approvedArticles.size !== 11) {
        errors.push('Tüm maddeler onaylanmalıdır.');
        isValid = false;
    }

    if (!isValid) {
        alert('Lütfen aşağıdaki hataları düzeltiniz:\n\n' + errors.join('\n'));
    }

    return isValid;
}

// ==================== PDF GENERATION ====================
function handleDownload(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Generate PDF
    generatePDF();
}

function generatePDF() {
    const fullName = fullNameInput.value;
    const tcNo = tcNoInput.value;
    const address = addressInput.value;
    const formDate = formatDate(formDateInput.value);

    // Create HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Arial', sans-serif;
                color: #333;
                line-height: 1.6;
                padding: 40px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            h1 {
                text-align: center;
                color: #004C97;
                font-size: 24px;
                margin-bottom: 30px;
                border-bottom: 3px solid #004C97;
                padding-bottom: 15px;
            }
            h2 {
                color: #003d78;
                font-size: 18px;
                margin-top: 25px;
                margin-bottom: 15px;
                border-left: 5px solid #004C97;
                padding-left: 10px;
            }
            .info-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .info-table th, .info-table td {
                padding: 12px;
                border: 1px solid #ddd;
                text-align: left;
                font-size: 14px;
            }
            .info-table th {
                background-color: #f5f5f5;
                font-weight: bold;
                width: 30%;
                color: #004C97;
            }
            .approved-list {
                list-style-type: none;
                padding-left: 0;
                margin-bottom: 20px;
            }
            .approved-list li {
                margin-bottom: 8px;
                font-size: 14px;
                color: #4CAF50;
                font-weight: 500;
                padding-left: 20px;
                position: relative;
            }
            .approved-list li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #4CAF50;
                font-weight: bold;
            }
            .summary {
                margin-top: 30px;
                padding: 20px;
                background-color: #e6f7e6;
                border: 2px solid #4CAF50;
                border-radius: 5px;
                font-size: 15px;
                text-align: center;
                color: #003d78;
                line-height: 1.8;
            }
            .footer-text {
                margin-top: 40px;
                font-size: 12px;
                color: #666;
                text-align: center;
                border-top: 1px dashed #ccc;
                padding-top: 15px;
            }
            .page-break {
                page-break-after: always;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>KİŞİSEL VERİLERİN KORUNMASI SÖZLEŞMESİ<br/>ONAY KAYDI</h1>
            
            <h2>İŞVEREN BİLGİLERİ</h2>
            <table class="info-table">
                <tr>
                    <th>Unvan:</th>
                    <td>BURAY DEMİRYOLU İNŞAAT A.Ş.</td>
                </tr>
                <tr>
                    <th>Adresi:</th>
                    <td>Ahlatlıbel Mah. 1902. Sok. NO: 43 ÇANKAYA / ANKARA</td>
                </tr>
            </table>

            <h2>İŞÇİ BİLGİLERİ</h2>
            <table class="info-table">
                <tr>
                    <th>Adı Soyadı:</th>
                    <td>${escapeHtml(fullName)}</td>
                </tr>
                <tr>
                    <th>T.C. Kimlik No:</th>
                    <td>${escapeHtml(tcNo)}</td>
                </tr>
                <tr>
                    <th>Adresi:</th>
                    <td>${escapeHtml(address)}</td>
                </tr>
                <tr>
                    <th>Onay Tarihi:</th>
                    <td>${formDate}</td>
                </tr>
            </table>

            <h2>ONAYLANAN MADDELER</h2>
            <ul class="approved-list">
                ${Array.from(formState.approvedArticles).sort((a, b) => a - b).map(num => `<li>Madde ${num}</li>`).join('')}
            </ul>

            <div class="summary">
                <strong>${escapeHtml(fullName)}</strong> tarafından <strong>${formDate}</strong> tarihinde 
                <strong>BURAY DEMİRYOLU İNŞAAT A.Ş.</strong>'nin Kişisel Verilerin Korunması Sözleşmesini 
                okuduğunu, anladığını ve tüm 11 maddeyi onayladığını göstermektedir.
            </div>

            <div class="footer-text">
                <p>Sistem tarafından otomatik oluşturulan onay kaydı.</p>
                <p style="margin-top: 10px;">Bu belge yasal bir dokümandır ve arşivlenmelidir.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Use html2pdf library to generate and download PDF
    const opt = {
        margin: 10,
        filename: `KVKK_Onay_Kaydi_${tcNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    // html2pdf'e doğrudan HTML dizesini ilet
    html2pdf().set(opt).from(htmlContent).save().then(() => {
        alert('PDF başarıyla indirildi!');
    }).catch(error => {
        console.error('PDF oluşturma hatası:', error);
        alert('PDF oluşturma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    });
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== SMOOTH SCROLL TO ARTICLE ====================
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('approve-btn')) {
        // Smooth scroll to the button
        event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', function(event) {
    // Ctrl+S or Cmd+S to save/download
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!downloadBtn.disabled) {
            handleDownload(event);
        }
    }
});

// ==================== PREVENT ACCIDENTAL NAVIGATION ====================
window.addEventListener('beforeunload', function(event) {
    if (formState.approvedArticles.size > 0 || Object.keys(formState.formData).length > 0) {
        event.preventDefault();
        event.returnValue = '';
    }
});

// ==================== CONSOLE LOGGING ====================
console.log('KVKK Form Script Loaded Successfully');
console.log('Form State:', formState);

