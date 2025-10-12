const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true, corePath: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js' });

const videoUpload = document.getElementById('video-upload');
const videoPlayer = document.getElementById('video-player');
const cutButton = document.getElementById('cut-button');
const loadingStatus = document.getElementById('loading-status');
const editorContainer = document.getElementById('editor-container');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const startDisplay = document.getElementById('start-display');
const endDisplay = document.getElementById('end-display');
const downloadLink = document.getElementById('download-link');

let videoDuration = 0;

// --- A. Upload dan Inisialisasi Player ---
videoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const videoURL = URL.createObjectURL(file);
        videoPlayer.src = videoURL;
        editorContainer.style.display = 'block';
        loadingStatus.textContent = 'Video siap diedit. Tunggu video dimuat.';
    }
});

// Setelah video termuat dan durasi diketahui
videoPlayer.addEventListener('loadedmetadata', () => {
    videoDuration = videoPlayer.duration;
    
    // Atur slider max ke durasi total
    startTimeInput.max = videoDuration;
    endTimeInput.max = videoDuration;
    endTimeInput.value = videoDuration;
    
    // Perbarui tampilan waktu awal
    startTimeInput.addEventListener('input', updateTimeDisplay);
    endTimeInput.addEventListener('input', updateTimeDisplay);
    
    updateTimeDisplay();
    loadingStatus.textContent = 'Video dimuat. Pilih durasi potongan.';
});

function updateTimeDisplay() {
    const start = parseFloat(startTimeInput.value).toFixed(2);
    const end = parseFloat(endTimeInput.value).toFixed(2);

    startDisplay.textContent = `${start}s`;
    endDisplay.textContent = `${end}s`;
    
    // Pindahkan player ke waktu awal saat menggeser
    videoPlayer.currentTime = start;
}

// --- B. Logika Pemotongan Video ---
cutButton.addEventListener('click', async () => {
    if (!videoPlayer.src) {
        alert('Silahkan upload video terlebih dahulu.');
        return;
    }

    loadingStatus.textContent = 'Menginisialisasi FFMPEG...';
    cutButton.disabled = true;

    // Pastikan ffmpeg sudah dimuat
    if (!ffmpeg.is
        Loaded()) {
        await ffmpeg.load();
    }

    try {
        const start = parseFloat(startTimeInput.value);
        const end = parseFloat(endTimeInput.value);
        const duration = end - start;

        // Mendapatkan file dari upload
        const inputFileName = 'input.mp4';
        const uploadedFile = videoUpload.files[0];

        // Menulis file ke Virtual File System (FS) ffmpeg
        loadingStatus.textContent = 'Menulis file video ke memori...';
        ffmpeg.FS('writeFile', inputFileName, await fetchFile(uploadedFile));

        // Perintah Cutting FFMPEG: -ss start_time -i input -t duration output
        loadingStatus.textContent = 'Memotong video (Client-Side Processing)...';
        await ffmpeg.run(
            '-ss', `${start}`,
            '-i', inputFileName,
            '-t', `${duration}`, // -t (duration) lebih akurat daripada -to (end time) saat -ss ada di awal
            '-c', 'copy', // Menggunakan 'copy' untuk pemotongan cepat (lossless) tanpa re-encode
            'output.mp4'
        );

        // Membaca file hasil potongan dari Virtual FS
        loadingStatus.textContent = 'Selesai! Membuat link download.';
        const data = ffmpeg.FS('readFile', 'output.mp4');

        // Membuat Blob dan URL untuk download
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'cut_video.mp4';
        downloadLink.style.display = 'block';
        downloadLink.textContent = 'Download cut_video.mp4';

    } catch (error) {
        console.error(error);
        loadingStatus.textContent = 'Terjadi kesalahan saat pemotongan: ' + error.message;
    } finally {
        cutButton.disabled = false;
    }
});
