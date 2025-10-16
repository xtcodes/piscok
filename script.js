const container = document.getElementById('container');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const image = document.querySelector('.image');
const canvas = document.getElementById('canvas');
const downloadButton = document.getElementById('downloadButton');
const shareButton = document.getElementById('shareButton');
const ctx = canvas.getContext('2d');

// --- PENTING: PATH FILE GAMBAR ---
// Pastikan file-file ini ada di folder yang sama dengan file HTML dan CSS Anda
const TWIBBON_URL = "twibbon.png"; 
const PLACEHOLDER_URL = "placeholder.png"; 

// --- Variabel State Gambar Pengguna ---
let userImage = null; 
let twibbonImage = null; 
let drawState = {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    initialScale: 1
};

// --- Variabel Interaksi ---
let isDragging = false;
let lastX = 0;
let lastY = 0;
let pointers = {};

// --- Fungsi Utama Gambar (Render) ---
function renderCanvas() {
    if (!userImage || !twibbonImage || canvas.width <= 0 || canvas.height <= 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    const userScaledWidth = userImage.width * drawState.initialScale * drawState.scale;
    const userScaledHeight = userImage.height * drawState.initialScale * drawState.scale;

    ctx.save();
    ctx.translate(canvas.width / 2 + drawState.x, canvas.height / 2 + drawState.y);
    ctx.drawImage(
        userImage, 
        -userScaledWidth / 2, 
        -userScaledHeight / 2, 
        userScaledWidth, 
        userScaledHeight
    );
    ctx.restore();

    ctx.drawImage(twibbonImage, 0, 0, canvas.width, canvas.height);
}

// --- Fungsi Pengelolaan State Awal ---
const resetToInitialState = (errorMessage = null) => {
    if (errorMessage) alert(errorMessage); 
     
    userImage = null;
    twibbonImage = null;
    drawState = { x: 0, y: 0, scale: 1, rotation: 0, initialScale: 1 };
     
    image.src = PLACEHOLDER_URL; 
    image.style.display = 'block';
    image.style.filter = 'none'; 
    image.style.opacity = '1';

    canvas.style.display = 'none'; 
    dropArea.classList.remove('active'); 
    dropArea.style.opacity = '0';
    dropArea.style.visibility = 'hidden';
     
    downloadButton.style.display = 'none';
    shareButton.style.display = 'none'; 

    container.classList.remove('uploaded'); 
    container.style.cursor = 'default'; 

    // Kembalikan tombol unduh ke keadaan awal
    downloadButton.textContent = 'Unduh Gambar';
    downloadButton.disabled = false;

    console.warn(`[INFO] Resetting to initial state. Error: ${errorMessage}`);
};

// --- Fungsi Pemuatan dan Penggabungan Gambar ---
function mergeImages(userImgSrc) {
    userImage = new Image();
    twibbonImage = new Image();
    let imagesLoaded = 0; 

    function drawIfReady() {
        imagesLoaded++;
        if (imagesLoaded < 2) return; 

        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        if (canvas.width <= 0 || canvas.height <= 0 || userImage.width <= 0 || userImage.height <= 0 || twibbonImage.width <= 0 || twibbonImage.height <= 0) {
            return resetToInitialState("Gagal memuat gambar. Periksa konsol untuk detail.");
        }
         
        drawState.initialScale = Math.min(canvas.width / userImage.width, canvas.height / userImage.height);

        canvas.style.display = 'block';
        image.style.display = 'none'; 
        dropArea.style.opacity = '0'; 
        dropArea.style.visibility = 'hidden';
        dropArea.classList.remove('active'); 
        container.classList.add('uploaded'); 
        container.style.cursor = 'default'; 
         
        downloadButton.style.display = 'block';
        shareButton.style.display = 'flex'; 

        // Pastikan tombol unduh aktif kembali saat gambar baru diupload
        downloadButton.textContent = 'Unduh Gambar';
        downloadButton.disabled = false;

        renderCanvas();
    }

    // Set crossOrigin agar gambar bisa diolah di canvas
    userImage.crossOrigin = "anonymous";
    twibbonImage.crossOrigin = "anonymous";

    userImage.onload = drawIfReady;
    userImage.onerror = () => resetToInitialState('Gagal memuat gambar user! Pastikan file gambar valid.');
    userImage.src = userImgSrc;

    twibbonImage.onload = drawIfReady;
    twibbonImage.onerror = () => resetToInitialState('Gagal memuat twibbon! Pastikan file "twibbon.png" ada dan path-nya benar.');
    twibbonImage.src = TWIBBON_URL;
}

// --- FUNGSI UTILITY: Membuat Blob dari Canvas Final ---
function getFinalCanvasBlob(callback) {
    if (!container.classList.contains('uploaded')) return;
     
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');
    const finalSize = 800; // Resolusi unduhan
    finalCanvas.width = finalSize;
    finalCanvas.height = finalSize;

    const finalInitialScale = Math.min(finalSize / userImage.width, finalSize / userImage.height);
    const finalUserScaledWidth = userImage.width * finalInitialScale * drawState.scale;
    const finalUserScaledHeight = userImage.height * finalInitialScale * drawState.scale;
     
    const ratio = finalSize / container.getBoundingClientRect().width; 
    const finalX = drawState.x * ratio;
    const finalY = drawState.y * ratio;

    finalCtx.save();
    finalCtx.translate(finalCanvas.width / 2 + finalX, finalCanvas.height / 2 + finalY);
    finalCtx.drawImage(
        userImage, 
        -finalUserScaledWidth / 2, 
        -finalUserScaledHeight / 2, 
        finalUserScaledWidth, 
        finalUserScaledHeight
    );
    finalCtx.restore();

    finalCtx.drawImage(twibbonImage, 0, 0, finalSize, finalSize);

    finalCanvas.toBlob(callback, 'image/png');
}

// --- FUNGSI SHARE ---
async function shareImage() {
    if (!container.classList.contains('uploaded')) {
        alert("Mohon upload dan edit gambar Anda terlebih dahulu.");
        return;
    }

    if (navigator.canShare && navigator.canShare({ files: [new File([""], "image.png", { type: "image/png" })] })) {
         
        getFinalCanvasBlob(async (blob) => {
            if (!blob) return;
             
            try {
                const file = new File([blob], 'twibbon-hasil.png', { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: 'Twibbon Keren!',
                    text: 'Lihat hasil twibbon saya!',
                    url: window.location.href,
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                     alert(`Gagal berbagi gambar. Error: ${error.message}`);
                }
            }
        });

    } 
    else if (navigator.share) {
         try {
            await navigator.share({
                title: 'Twibbon Keren!',
                text: 'Saya sudah membuat twibbon! Silakan coba juga.',
                url: window.location.href,
            });
        } catch (error) {
             if (error.name !== 'AbortError') {
                 alert(`Gagal berbagi link. Error: ${error.message}`);
             }
        }
    } 
    else {
        alert("Browser Anda tidak mendukung fitur berbagi. Silakan unduh gambar dan bagikan secara manual.");
    }
}


// --- Event Listeners Dll ---

document.addEventListener('DOMContentLoaded', () => {
    image.onerror = () => {
        image.src = ''; 
        image.alt = 'Gagal memuat placeholder';
    };
    image.src = PLACEHOLDER_URL; 
    container.classList.remove('uploaded');
    container.style.cursor = 'default';
     
    downloadButton.style.display = 'none';
    shareButton.style.display = 'none';
});

// Mengelola efek hover/blur dan aktivasi dropArea
container.addEventListener('mouseenter', () => {
    if (!container.classList.contains('uploaded')) {
        dropArea.classList.add('active'); 
        container.style.cursor = 'pointer'; 
    }
});

container.addEventListener('mouseleave', () => {
    if (!container.classList.contains('uploaded') && !dropArea.classList.contains('dragover')) {
        dropArea.classList.remove('active'); 
        container.style.cursor = 'default'; 
    }
});

// klik drop area → file dialog
dropArea.addEventListener('click', e => {
    e.stopPropagation(); 
    fileInput.click();
});

// upload file
fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = ev => mergeImages(ev.target.result);
        reader.readAsDataURL(e.target.files[0]);
         
        dropArea.classList.remove('active');
        dropArea.style.opacity = '0';
        dropArea.style.visibility = 'hidden';
    }
});

// drag & drop
dropArea.addEventListener('dragover', e => {
    e.preventDefault(); 
    if (!dropArea.classList.contains('active')) {
        dropArea.classList.add('active');
    }
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
    dropArea.classList.remove('active'); 
    container.style.cursor = 'default'; 
});

dropArea.addEventListener('drop', e => {
    e.preventDefault(); 
    dropArea.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const reader = new FileReader();
        reader.onload = ev => mergeImages(ev.target.result);
        reader.readAsDataURL(e.dataTransfer.files[0]);
         
        dropArea.classList.remove('active');
        dropArea.style.opacity = '0';
        dropArea.style.visibility = 'hidden';
    }
});

// Event listener tombol Unduh (DIPERBAIKI)
downloadButton.addEventListener('click', () => {
    // 1. Ubah teks dan disable tombol secara permanen
    downloadButton.textContent = 'Memproses...';
    downloadButton.disabled = true;

    getFinalCanvasBlob((blob) => {
        if (!blob) {
            // Jika gagal, tombol tetap disable (sesuai permintaan)
            return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'twibbon-hasil.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Catatan: Tombol tetap disabled setelah unduhan selesai.
    });
});

// Event listener tombol Bagikan
shareButton.addEventListener('click', shareImage);


// ==========================================================
// --- FITUR GESER (PAN) DAN ZOOM (PINCH) ---
// ==========================================================

// --- MOUSE & PC ---

canvas.addEventListener('wheel', e => {
    if (!container.classList.contains('uploaded')) return;
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = drawState.scale * scaleFactor;
    if (newScale < 0.5 || newScale > 5.0) return;
    drawState.scale = newScale;
    renderCanvas();
});
canvas.addEventListener('mousedown', e => {
    if (!container.classList.contains('uploaded')) return;
    e.preventDefault();
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});
canvas.addEventListener('mousemove', e => {
    if (!isDragging || !container.classList.contains('uploaded')) return;
    e.preventDefault();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    drawState.x += dx;
    drawState.y += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    renderCanvas();
});
canvas.addEventListener('mouseup', () => {
    isDragging = false;
});
canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

// --- TOUCH & MOBILE ---

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
}
let initialPinchDistance = null;
let initialScale = 1;
canvas.addEventListener('touchstart', e => {
    if (!container.classList.contains('uploaded')) return;
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        pointers[e.touches[i].identifier] = e.touches[i];
    }
    const touchCount = Object.keys(pointers).length;
    if (touchCount === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        initialPinchDistance = null;
    } else if (touchCount === 2) {
        isDragging = false;
        initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = drawState.scale;
    }
});
canvas.addEventListener('touchmove', e => {
    if (!container.classList.contains('uploaded')) return;
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        pointers[e.touches[i].identifier] = e.touches[i];
    }
    const currentPointers = Object.values(pointers);
    const touchCount = currentPointers.length;
    if (touchCount === 1 && isDragging) {
        const dx = currentPointers[0].clientX - lastX;
        const dy = currentPointers[0].clientY - lastY;
        drawState.x += dx;
        drawState.y += dy;
        lastX = currentPointers[0].clientX;
        lastY = currentPointers[0].clientY;
    } else if (touchCount === 2 && initialPinchDistance !== null) {
        const currentDistance = getDistance(currentPointers[0], currentPointers[1]);
        let scaleDelta = currentDistance / initialPinchDistance;
        let newScale = initialScale * scaleDelta;
        if (newScale < 0.5) newScale = 0.5;
        if (newScale > 5.0) newScale = 5.0;
        drawState.scale = newScale;
    }
    renderCanvas();
});
canvas.addEventListener('touchend', e => {
    if (!container.classList.contains('uploaded')) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
        delete pointers[e.changedTouches[i].identifier];
    }
    const touchCount = Object.keys(pointers).length;
    if (touchCount < 2) {
        initialPinchDistance = null;
        initialScale = 1;
    }
    if (touchCount === 0) {
        isDragging = false;
    }
    if (touchCount === 1) {
        isDragging = true;
        const remainingTouch = Object.values(pointers)[0];
        lastX = remainingTouch.clientX;
        lastY = remainingTouch.clientY;
    }
});
canvas.addEventListener('touchcancel', () => {
    isDragging = false;
    pointers = {};
    initialPinchDistance = null;
});
