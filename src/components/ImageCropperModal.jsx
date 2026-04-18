// src/components/ImageCropperModal.jsx
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropUtils"; // utility to create cropped blob
import { FaTimes } from "react-icons/fa";

export default function ImageCropperModal({ imageSrc, isOpen, onCancel, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (c) => setCrop(c);
  const onZoomChange = (z) => setZoom(z);

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(croppedImageBlob);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded w-[90%] max-w-md relative">
        <button onClick={onCancel} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900">
          <FaTimes />
        </button>
        <div className="relative w-full h-64 bg-gray-200">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
          />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
}