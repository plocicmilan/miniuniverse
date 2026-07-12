// camera.js — Foto capture i kompresija
// Koristi <input capture="environment"> za kompatibilnost sa iOS i Android

const MAX_WIDTH = 1200;   // px
const QUALITY = 0.75;     // JPEG quality (0-1)

// Kompresuje File/Blob sliku i vraca base64 string
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(MAX_WIDTH / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Procesira sve slike iz <input type="file"> i vraca array base64
async function processFiles(fileList) {
  const results = [];
  for (const file of fileList) {
    if (!file.type.startsWith('image/')) continue;
    const compressed = await compressImage(file);
    results.push(compressed);
  }
  return results;
}

// Procena velicine: vraca KB
function estimateSizeKB(base64) {
  return Math.round((base64.length * 3) / 4 / 1024);
}

export { compressImage, processFiles, estimateSizeKB };
