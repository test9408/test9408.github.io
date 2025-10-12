const { createFFmpeg, fetchFile } = FFmpeg;

// Mengambil elemen dari HTML
const uploader = document.getElementById('uploader');
const editor = document.getElementById('editor');
const processing = document.getElementById('processing');
const videoInput = document.getElementById('video-input');
const videoPlayer = document.getElementById('video-player');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const cutButton = document.getElementById('cut-button');
const statusText = document.getElementById('status-text');
const downloadLink = document.getElementById('download-link');
const loader = document.querySelector('.loader');

let videoFile = null;

// Setup FFMPEG
const ffmpeg = createFFmpeg({
    log: true, // Tampilkan log proses di console browser untuk debugging
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js', // Membutuhkan path ini agar FFMPEG berjalan
});

// Fungsi untuk memuat FFMPEG saat pertama kali
const loadFFmpeg = async () => {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }
};

loadFFmpeg(); // Langsung muat FFMPEG saat halaman dibuka

// Event listener untuk input file
videoInput.addEventListener('change', (event) => {
    videoFile = event.target.files[0];
    if (videoFile) {
        const fileURL = URL.createObjectURL(videoFile);
        videoPlayer.src = fileURL;

        // Tampilkan editor setelah video dipilih
        uploader.classList.add('hidden');
        editor.classList.remove('hidden');

        // Saat metadata video sudah termuat, atur nilai maksimal untuk end time
        videoPlayer.onloadedmetadata = () => {
            endTimeInput.value = videoPlayer.duration.toFixed(1);
            endTimeInput.max = videoPlayer.duration.toFixed(1);
        };
    }
});

// Event listener untuk tombol "Potong Video"
cutButton.addEventListener('click', async () => {
    // Sembunyikan editor dan tampilkan area proses
    editor.classList.add('hidden');
    processing.classList.remove('hidden');
    downloadLink.classList.add('hidden');
    loader.style.display = 'block';

    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;

    if (parseFloat(startTime) >= parseFloat(endTime)) {
        alert("Waktu mulai harus lebih kecil dari waktu selesai!");
        processing.classList.add('hidden');
        editor.classList.remove('hidden');
        return;
    }

    statusText.textContent = 'Mempersiapkan file video...';

    try {
        // 1. Menulis file video ke memori virtual FFMPEG
        ffmpeg.FS('writeFile', videoFile.name, await fetchFile(videoFile));
        statusText.textContent = 'Memulai proses pemotongan... Ini mungkin butuh beberapa saat.';

        // 2. Menjalankan command FFMPEG
        // -i: file input
        // -ss: waktu mulai (seek start)
        // -to: waktu selesai (seek to)
        // -c copy: Menyalin codec video & audio (sangat cepat, tanpa re-encoding)
        await ffmpeg.run('-i', videoFile.name, '-ss', startTime, '-to', endTime, '-c', 'copy', 'output.mp4');

        statusText.textContent = 'Proses selesai! Menyiapkan file untuk diunduh...';

        // 3. Membaca file hasil dari memori virtual
        const data = ffmpeg.FS('readFile', 'output.mp4');

        // 4. Membuat URL yang bisa diunduh dari data hasil
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);

        downloadLink.href = url;
        downloadLink.download = `potongan_${videoFile.name}`; // Nama file hasil
        
        // Tampilkan tombol unduh
        loader.style.display = 'none';
        downloadLink.classList.remove('hidden');
        statusText.textContent = 'Video Anda siap diunduh!';

    } catch (error) {
        console.error(error);
        statusText.textContent = 'Terjadi kesalahan saat memproses video.';
        loader.style.display = 'none';
    }
});
