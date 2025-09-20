let allDesigns = [];
let filteredDesigns = [];

document.addEventListener('DOMContentLoaded', function() {
    loadDesigns();
    setupEventListeners();
});

function loadDesigns() {
    // Load designs from localStorage
    allDesigns = JSON.parse(localStorage.getItem('nationalDayDesigns') || '[]');
    filteredDesigns = [...allDesigns];
    
    updateStats();
    populateClassFilter();
    displayDesigns();
}

function updateStats() {
    const totalDesigns = allDesigns.length;
    const uniqueClasses = [...new Set(allDesigns.map(design => design.studentClass))].length;
    
    document.getElementById('totalDesigns').textContent = totalDesigns;
    document.getElementById('totalClasses').textContent = uniqueClasses;
}

function populateClassFilter() {
    const classFilter = document.getElementById('filterClass');
    const uniqueClasses = [...new Set(allDesigns.map(design => design.studentClass))].sort();
    
    // Clear existing options except "all"
    classFilter.innerHTML = '<option value="all">جميع الصفوف</option>';
    
    uniqueClasses.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classFilter.appendChild(option);
    });
}

function displayDesigns() {
    const designGrid = document.getElementById('designGrid');
    const emptyGallery = document.getElementById('emptyGallery');
    
    if (filteredDesigns.length === 0) {
        designGrid.style.display = 'none';
        emptyGallery.style.display = 'block';
        return;
    }
    
    designGrid.style.display = 'grid';
    emptyGallery.style.display = 'none';
    
    designGrid.innerHTML = '';
    
    filteredDesigns.forEach(design => {
        const designCard = createDesignCard(design);
        designGrid.appendChild(designCard);
    });
}

function createDesignCard(design) {
    const card = document.createElement('div');
    card.className = 'design-card';
    
    const date = new Date(design.timestamp).toLocaleDateString('ar-SA');
    
    card.innerHTML = `
        <img src="${design.imageData}" alt="تصميم ${design.studentName}" class="design-image">
        <div class="design-info">
            <h3>${design.studentName}</h3>
            <p><strong>الصف:</strong> ${design.studentClass}</p>
            <p><strong>التاريخ:</strong> ${date}</p>
            ${design.studentComment ? `<p><strong>التعليق:</strong> ${design.studentComment}</p>` : ''}
        </div>
        <div class="design-actions">
            <button class="download-btn" onclick="downloadDesign('${design.id}')">تحميل</button>
            <button class="print-btn" onclick="printDesign('${design.id}')">طباعة</button>
        </div>
    `;
    
    return card;
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchDesigns');
    const classFilter = document.getElementById('filterClass');
    const sortSelect = document.getElementById('sortBy');
    
    searchInput.addEventListener('input', filterDesigns);
    classFilter.addEventListener('change', filterDesigns);
    sortSelect.addEventListener('change', sortDesigns);
}

function filterDesigns() {
    const searchTerm = document.getElementById('searchDesigns').value.toLowerCase();
    const selectedClass = document.getElementById('filterClass').value;
    
    filteredDesigns = allDesigns.filter(design => {
        const matchesSearch = design.studentName.toLowerCase().includes(searchTerm) ||
                            design.studentClass.toLowerCase().includes(searchTerm) ||
                            (design.studentComment && design.studentComment.toLowerCase().includes(searchTerm));
        
        const matchesClass = selectedClass === 'all' || design.studentClass === selectedClass;
        
        return matchesSearch && matchesClass;
    });
    
    sortDesigns();
}

function sortDesigns() {
    const sortBy = document.getElementById('sortBy').value;
    
    switch(sortBy) {
        case 'newest':
            filteredDesigns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
        case 'oldest':
            filteredDesigns.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            break;
        case 'name':
            filteredDesigns.sort((a, b) => a.studentName.localeCompare(b.studentName, 'ar'));
            break;
    }
    
    displayDesigns();
}

function downloadDesign(designId) {
    const design = allDesigns.find(d => d.id == designId);
    if (!design) return;
    
    // Create download link
    const link = document.createElement('a');
    link.download = `تصميم_${design.studentName}_${design.studentClass}.png`;
    link.href = design.imageData;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printDesign(designId) {
    const design = allDesigns.find(d => d.id == designId);
    if (!design) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>طباعة تصميم ${design.studentName}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 20px;
                    direction: rtl;
                }
                .design-image {
                    max-width: 100%;
                    height: auto;
                    border: 2px solid #004d40;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .design-info {
                    margin: 20px 0;
                    font-size: 18px;
                }
                .header {
                    color: #004d40;
                    margin-bottom: 30px;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>مصمم الخلفيات الوطنية - أكاديمية طويق</h1>
                <h2>عزنا بطبعنا</h2>
            </div>
            <img src="${design.imageData}" alt="تصميم ${design.studentName}" class="design-image">
            <div class="design-info">
                <p><strong>اسم الطالب:</strong> ${design.studentName}</p>
                <p><strong>الصف:</strong> ${design.studentClass}</p>
                <p><strong>التاريخ:</strong> ${new Date(design.timestamp).toLocaleDateString('ar-SA')}</p>
                ${design.studentComment ? `<p><strong>التعليق:</strong> ${design.studentComment}</p>` : ''}
            </div>
            <button class="no-print" onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #00796b; color: white; border: none; border-radius: 5px; cursor: pointer;">طباعة</button>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Auto-print after a short delay
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Add some sample designs for demonstration (remove in production)
function addSampleDesigns() {
    if (allDesigns.length === 0) {
        const sampleDesigns = [
            {
                id: Date.now() - 1000,
                studentName: 'أحمد محمد',
                studentClass: 'الصف الثالث الثانوي',
                studentComment: 'تصميم يعبر عن حبي لوطني',
                imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        
        localStorage.setItem('nationalDayDesigns', JSON.stringify(sampleDesigns));
        loadDesigns();
    }
}

