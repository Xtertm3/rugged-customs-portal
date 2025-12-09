import React, { useState, useRef, useEffect } from 'react';

interface CameraModalProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const openCamera = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions.");
      }
    };

    openCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob((blob) => {
            if (blob) {
                const fileName = `capture-${new Date().toISOString()}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                onCapture(file);
            }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-fade-in" onClick={onClose}>
        <div className="relative w-full max-w-4xl p-4" onClick={e => e.stopPropagation()}>
            {error ? (
                <div className="text-center text-red-400 bg-zinc-800 p-8 rounded-lg">
                    <h2 className="text-xl font-bold">Camera Error</h2>
                    <p>{error}</p>
                </div>
            ) : (
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg" />
            )}
             <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="absolute bottom-8 flex items-center gap-8">
            <button
                onClick={handleCapture}
                disabled={!stream}
                className="w-20 h-20 bg-white rounded-full border-4 border-zinc-500 flex items-center justify-center disabled:opacity-50"
                aria-label="Capture photo"
            >
                <div className="w-16 h-16 bg-white rounded-full ring-2 ring-inset ring-black"></div>
            </button>
        </div>
         <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-zinc-300">&times;</button>
    </div>
  );
};
