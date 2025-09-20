let allDesigns = [];
let selectedDesigns = new Set();
const ADMIN_PASSWORD = 'admin123';

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkLoginStatus();
});

function setupEventListeners() {
    document.getElementById('loginAdmin').addEventListener('click', login);
    document.getElementById('adminPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('downloadAllDesigns').addEventListener('click', downloadAllDesigns);
    document.getElementById('printSelectedDesigns').addEventListener('click', printSelectedDesigns);
    document.getElementById('exportToPDF').addEventListener('click', exportToPDF);
    document.getElementById('clearAllDesigns').addEventListener('click', clearAllDesigns);
    document.getElementById('selectAllDesigns').addEventListener('click', selectAllDesigns);
    document.getElementById('deselectAllDesigns').addEventListener('click', deselectAllDesigns);
}

function checkLoginStatus() {
    // Check if admin is already logged in (session storage)
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showAdminContent();
    }
}

function login() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminContent();
    } else {
        alert('كلمة المرور غير صحيحة');
        document.getElementById('adminPassword').value = '';
    }
}

function showAdminContent() {
    document.getElementById('passwordSection').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    loadDesigns();
}

function loadDesigns() {
    allDesigns = JSON.parse(localStorage.getItem('nationalDayDesigns') || '[]');
    updateStats();
    displayDesigns();
}

function updateStats() {
    const totalDesigns = allDesigns.length;
    const uniqueClasses = [...new Set(allDesigns.map(design => design.studentClass))].length;
    
    document.getElementById('adminTotalDesigns').textContent = totalDesigns;
    document.getElementById('adminTotalClasses').textContent = uniqueClasses;
    document.getElementById('selectedCount').textContent = selectedDesigns.size;
}

function displayDesigns() {
    const designList = document.getElementById('adminDesignList');
    const noDesigns = document.getElementById('noDesigns');
    
    if (allDesigns.length === 0) {
        designList.style.display = 'none';
        noDesigns.style.display = 'block';
        return;
    }
    
    designList.style.display = 'grid';
    noDesigns.style.display = 'none';
    
    designList.innerHTML = '';
    
    allDesigns.forEach(design => {
        const designCard = createAdminDesignCard(design);
        designList.appendChild(designCard);
    });
}

function createAdminDesignCard(design) {
    const card = document.createElement('div');
    card.className = 'admin-design-card';
    card.dataset.designId = design.id;
    
    const date = new Date(design.timestamp).toLocaleDateString('ar-SA');
    const time = new Date(design.timestamp).toLocaleTimeString('ar-SA');
    
    card.innerHTML = `
        <div class="design-checkbox">
            <input type="checkbox" id="checkbox-${design.id}" onchange="toggleDesignSelection('${design.id}')">
            <label for="checkbox-${design.id}">تحديد للطباعة</label>
        </div>
        <img src="${design.imageData}" alt="تصميم ${design.studentName}" class="admin-design-image">
        <div class="admin-design-info">
            <h4>${design.studentName}</h4>
            <p><strong>الصف:</strong> ${design.studentClass}</p>
            <p><strong>التاريخ:</strong> ${date}</p>
            <p><strong>الوقت:</strong> ${time}</p>
            ${design.studentComment ? `<p><strong>التعليق:</strong> ${design.studentComment}</p>` : ''}
            <p><strong>ID:</strong> ${design.id}</p>
        </div>
    `;
    
    return card;
}

function toggleDesignSelection(designId) {
    const checkbox = document.getElementById(`checkbox-${designId}`);
    const card = document.querySelector(`[data-design-id="${designId}"]`);
    
    if (checkbox.checked) {
        selectedDesigns.add(designId);
        card.classList.add('selected');
    } else {
        selectedDesigns.delete(designId);
        card.classList.remove('selected');
    }
    
    updateStats();
}

function selectAllDesigns() {
    allDesigns.forEach(design => {
        selectedDesigns.add(design.id.toString());
        const checkbox = document.getElementById(`checkbox-${design.id}`);
        const card = document.querySelector(`[data-design-id="${design.id}"]`);
        if (checkbox) {
            checkbox.checked = true;
            card.classList.add('selected');
        }
    });
    updateStats();
}

function deselectAllDesigns() {
    selectedDesigns.clear();
    allDesigns.forEach(design => {
        const checkbox = document.getElementById(`checkbox-${design.id}`);
        const card = document.querySelector(`[data-design-id="${design.id}"]`);
        if (checkbox) {
            checkbox.checked = false;
            card.classList.remove('selected');
        }
    });
    updateStats();
}

async function downloadAllDesigns() {
    if (allDesigns.length === 0) {
        alert('لا توجد تصاميم للتنزيل');
        return;
    }
    
    const zip = new JSZip();
    const folder = zip.folder('تصاميم_اليوم_الوطني');
    
    // Add designs to zip
    allDesigns.forEach((design, index) => {
        const imageData = design.imageData.split(',')[1]; // Remove data:image/png;base64,
        const fileName = `${design.studentName}_${design.studentClass}_${design.id}.png`;
        folder.file(fileName, imageData, {base64: true});
    });
    
    // Add summary file
    const summary = generateSummaryText();
    folder.file('ملخص_التصاميم.txt', summary);
    
    try {
        const content = await zip.generateAsync({type: 'blob'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `تصاميم_اليوم_الوطني_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('تم تنزيل جميع التصاميم بنجاح!');
    } catch (error) {
        alert('حدث خطأ أثناء إنشاء ملف ZIP');
        console.error(error);
    }
}

function printSelectedDesigns() {
    if (selectedDesigns.size === 0) {
        alert('يرجى تحديد تصاميم للطباعة');
        return;
    }
    
    const selectedDesignData = allDesigns.filter(design => 
        selectedDesigns.has(design.id.toString())
    );
    
    // Create print window
    const printWindow = window.open('', '_blank');
    let printContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>طباعة التصاميم المحددة</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    direction: rtl;
                }
                .header {
                    text-align: center;
                    color: #004d40;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #00796b;
                    padding-bottom: 20px;
                }
                .design-page {
                    page-break-after: always;
                    margin-bottom: 40px;
                    text-align: center;
                }
                .design-page:last-child {
                    page-break-after: auto;
                }
                .design-image {
                    max-width: 100%;
                    max-height: 500px;
                    border: 2px solid #004d40;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .design-info {
                    margin: 20px 0;
                    font-size: 16px;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
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
                <p>تصاميم الطلاب المحددة للطباعة</p>
            </div>
    `;
    
    selectedDesignData.forEach(design => {
        printContent += `
            <div class="design-page">
                <img src="${design.imageData}" alt="تصميم ${design.studentName}" class="design-image">
                <div class="design-info">
                    <p><strong>اسم الطالب:</strong> ${design.studentName}</p>
                    <p><strong>الصف:</strong> ${design.studentClass}</p>
                    <p><strong>التاريخ:</strong> ${new Date(design.timestamp).toLocaleDateString('ar-SA')}</p>
                    ${design.studentComment ? `<p><strong>التعليق:</strong> ${design.studentComment}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    printContent += `
            <button class="no-print" onclick="window.print()" style="padding: 15px 30px; font-size: 18px; background: #00796b; color: white; border: none; border-radius: 5px; cursor: pointer; position: fixed; top: 20px; left: 20px;">طباعة</button>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

function exportToPDF() {
    if (selectedDesigns.size === 0) {
        alert('يرجى تحديد تصاميم للتصدير');
        return;
    }
    
    const selectedDesignData = allDesigns.filter(design => 
        selectedDesigns.has(design.id.toString())
    );
    
    // Note: This is a simplified PDF export. For production, consider using a more robust PDF library
    alert(`سيتم تصدير ${selectedDesignData.length} تصميم إلى PDF. هذه الميزة قيد التطوير.`);
}

function clearAllDesigns() {
    if (allDesigns.length === 0) {
        alert('لا توجد تصاميم لمسحها');
        return;
    }
    
    const confirmDelete = confirm(`هل أنت متأكد من مسح جميع التصاميم (${allDesigns.length} تصميم)؟ هذا الإجراء لا يمكن التراجع عنه.`);
    
    if (confirmDelete) {
        const doubleConfirm = confirm('تأكيد نهائي: سيتم مسح جميع التصاميم نهائياً. هل تريد المتابعة؟');
        
        if (doubleConfirm) {
            localStorage.removeItem('nationalDayDesigns');
            allDesigns = [];
            selectedDesigns.clear();
            updateStats();
            displayDesigns();
            alert('تم مسح جميع التصاميم بنجاح');
        }
    }
}

function generateSummaryText() {
    const totalDesigns = allDesigns.length;
    const uniqueClasses = [...new Set(allDesigns.map(design => design.studentClass))];
    const classCounts = {};
    
    allDesigns.forEach(design => {
        classCounts[design.studentClass] = (classCounts[design.studentClass] || 0) + 1;
    });
    
    let summary = `ملخص تصاميم اليوم الوطني - أكاديمية طويق\n`;
    summary += `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}\n\n`;
    summary += `إجمالي التصاميم: ${totalDesigns}\n`;
    summary += `عدد الصفوف المشاركة: ${uniqueClasses.length}\n\n`;
    summary += `توزيع التصاميم حسب الصف:\n`;
    
    Object.entries(classCounts).forEach(([className, count]) => {
        summary += `- ${className}: ${count} تصميم\n`;
    });
    
    summary += `\n\nتفاصيل التصاميم:\n`;
    summary += `${'='.repeat(50)}\n`;
    
    allDesigns.forEach((design, index) => {
        summary += `\n${index + 1}. ${design.studentName}\n`;
        summary += `   الصف: ${design.studentClass}\n`;
        summary += `   التاريخ: ${new Date(design.timestamp).toLocaleDateString('ar-SA')}\n`;
        summary += `   الوقت: ${new Date(design.timestamp).toLocaleTimeString('ar-SA')}\n`;
        if (design.studentComment) {
            summary += `   التعليق: ${design.studentComment}\n`;
        }
        summary += `   معرف التصميم: ${design.id}\n`;
    });
    
    return summary;
}

