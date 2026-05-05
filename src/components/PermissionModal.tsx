import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera } from 'lucide-react';

interface PermissionModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function PermissionModal({ onAccept, onDecline }: PermissionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md overflow-hidden bg-white rounded-3xl shadow-2xl"
        id="permission_modal"
      >
        <div className="p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-pink-50 rounded-2xl">
            <Camera className="w-8 h-8 text-pink-500" />
          </div>
          
          <h2 className="mb-4 text-2xl font-bold text-gray-900 font-sans">
            Доступ к камере
          </h2>
          
          <p className="mb-8 text-gray-600 leading-relaxed">
            Пожалуйста, разрешите доступ к камере для продолжения общения. Это поможет нам сделать общение более живым! ✨
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onAccept}
              className="w-full py-4 text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-transform"
              id="accept_camera_btn"
            >
              Allow
            </button>
            <button
              onClick={onDecline}
              className="w-full py-4 text-lg font-medium text-gray-400 bg-transparent rounded-2xl hover:text-gray-600 transition-colors"
              id="decline_camera_btn"
            >
              Не сейчас
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
