// Initialize Fabric.js canvas
let canvas;
let currentFont = 'Arial';
let currentFontSize = 30;
let currentTextColor = '#004d40';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize canvas
    canvas = new fabric.Canvas('designCanvas', {
        backgroundColor: '#ffffff'
    });

    // Set canvas size for responsiveness
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Add default text
    addWelcomeText();

    // Event listeners for controls
    document.getElementById('addText').addEventListener('click', addText);
    document.getElementById('textColorPicker').addEventListener('change', updateTextColor);
    document.getElementById('fontSelector').addEventListener('change', updateFont);
    document.getElementById('fontSizeSelector').addEventListener('change', updateFontSize);
    document.getElementById('backgroundColorPicker').addEventListener('change', updateBackgroundColor);
    document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
    document.getElementById('submitDesign').addEventListener('click', submitDesign);

    // Logo selection
    document.querySelectorAll('.logo-item').forEach(logo => {
        logo.addEventListener('click', function() {
            addLogo(this.src);
        });
    });
});

function resizeCanvas() {
    const container = document.querySelector('.design-interface');
    const maxWidth = Math.min(600, container.offsetWidth - 60);
    const height = Math.min(400, maxWidth * 0.67);
    
    canvas.setDimensions({
        width: maxWidth,
        height: height
    });
}

function addWelcomeText() {
    const text = new fabric.Text('عزنا بطبعنا', {
        left: canvas.width / 2,
        top: canvas.height / 2,
        fontFamily: 'Tajawal',
        fontSize: 40,
        fill: '#004d40',
        textAlign: 'center',
        originX: 'center',
        originY: 'center'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
}

function addText() {
    const text = prompt('أدخل النص:');
    if (text) {
        const textObj = new fabric.Text(text, {
            left: 100,
            top: 100,
            fontFamily: currentFont,
            fontSize: currentFontSize,
            fill: currentTextColor,
            textAlign: 'right'
        });
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
    }
}

function updateTextColor(e) {
    currentTextColor = e.target.value;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
        activeObject.set('fill', currentTextColor);
        canvas.renderAll();
    }
}

function updateFont(e) {
    currentFont = e.target.value;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
        activeObject.set('fontFamily', currentFont);
        canvas.renderAll();
    }
}

function updateFontSize(e) {
    currentFontSize = parseInt(e.target.value);
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
        activeObject.set('fontSize', currentFontSize);
        canvas.renderAll();
    }
}

function updateBackgroundColor(e) {
    canvas.setBackgroundColor(e.target.value, canvas.renderAll.bind(canvas));
}

function addLogo(logoSrc) {
    fabric.Image.fromURL(logoSrc, function(img) {
        // Scale the image to fit nicely on canvas
        const scale = Math.min(150 / img.width, 150 / img.height);
        img.set({
            left: 50,
            top: 50,
            scaleX: scale,
            scaleY: scale
        });
        canvas.add(img);
        canvas.setActiveObject(img);
    });
}

function clearCanvas() {
    if (confirm('هل أنت متأكد من مسح جميع العناصر؟')) {
        canvas.clear();
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
    }
}

function submitDesign() {
    const studentName = document.getElementById('studentName').value.trim();
    const studentClass = document.getElementById('studentClass').value.trim();
    const studentComment = document.getElementById('studentComment').value.trim();

    if (!studentName || !studentClass) {
        alert('يرجى إدخال الاسم والصف');
        return;
    }

    // Convert canvas to image
    const dataURL = canvas.toDataURL('image/png');
    
    // Create design object
    const design = {
        id: Date.now(),
        studentName: studentName,
        studentClass: studentClass,
        studentComment: studentComment,
        imageData: dataURL,
        timestamp: new Date().toISOString()
    };

    // Save to localStorage (in a real app, this would be sent to a server)
    let designs = JSON.parse(localStorage.getItem('nationalDayDesigns') || '[]');
    designs.push(design);
    localStorage.setItem('nationalDayDesigns', JSON.stringify(designs));

    alert('تم إرسال تصميمك بنجاح! شكراً لمشاركتك.');
    
    // Redirect to gallery
    window.location.href = 'gallery.html';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'z':
                e.preventDefault();
                // Undo functionality could be added here
                break;
            case 's':
                e.preventDefault();
                submitDesign();
                break;
        }
    }
    
    // Delete selected object
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.remove(activeObject);
        }
    }
});

