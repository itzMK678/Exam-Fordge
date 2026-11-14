const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Direct-to-Supabase Storage uploader with progress tracking and retry support.
 * Bypasses Vercel's 4.5 MB request body limit entirely.
 */
export async function uploadFileDirectToStorage({
  file,
  bucket = "lecture-recordings", // "lecture-recordings" or "study-documents"
  getUrlEndpoint = "/api/lectures/upload-url",
  onProgress = () => {},
  maxRetries = 3,
}) {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      attempt++;
      // 1. Request signed upload URL from backend
      const res = await fetch(`${API_URL}${getUrlEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
        }),
      });

      const urlData = await res.json();
      if (!res.ok || !urlData.uploadUrl) {
        throw new Error(urlData.message || "Failed to get signed upload URL.");
      }

      const { uploadUrl, path, token } = urlData;

      // 2. Perform direct upload to Supabase Storage via XMLHttpRequest for exact progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        if (token) {
          xhr.setRequestHeader("x-upsert", "true");
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent, event.loaded, event.total);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(
              new Error(`Storage upload failed with status ${xhr.status}: ${xhr.statusText}`)
            );
          }
        };

        xhr.onerror = () => reject(new Error("Network connection error during direct upload."));
        xhr.ontimeout = () => reject(new Error("Storage upload timed out."));

        xhr.send(file);
      });

      // Upload completed successfully
      return {
        path,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileType: file.name.split(".").pop()?.toLowerCase(),
      };
    } catch (err) {
      lastError = err;
      console.warn(`[Upload Attempt ${attempt}/${maxRetries} Failed]:`, err.message);
      if (attempt < maxRetries) {
        // Wait with exponential backoff before retry
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }
  }

  throw lastError || new Error("Failed to upload file after maximum retries.");
}

/**
 * Direct upload for study documents (PDFs, DOCX) bypassing Vercel body limits
 */
export async function uploadDocumentDirect(file, onProgress) {
  return uploadFileDirectToStorage({
    file,
    bucket: "study-documents",
    getUrlEndpoint: "/api/documents/upload-url",
    onProgress,
  });
}

/**
 * Direct upload for lecture recordings (MP3, WAV, M4A, MP4) bypassing Vercel body limits
 */
export async function uploadLectureDirect(file, onProgress) {
  return uploadFileDirectToStorage({
    file,
    bucket: "lecture-recordings",
    getUrlEndpoint: "/api/lectures/upload-url",
    onProgress,
  });
}
