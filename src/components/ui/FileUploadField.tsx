'use client';

import React, { useRef, useState } from 'react';

interface FileUploadFieldProps {
  label: string;
  error?: string;
  accept?: string;
  maxSizeMB?: number;
  onChange: (file: File | null) => void;
  id?: string;
  required?: boolean;
}

/**
 * Komponen upload file dengan area drag & drop.
 * Mendukung validasi tipe file dan ukuran maksimal.
 */
export function FileUploadField({
  label,
  error,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 2,
  onChange,
  id,
  required,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');

  const validateAndSet = (file: File | null) => {
    setLocalError(null);

    if (!file) {
      setFileName(null);
      onChange(null);
      return;
    }

    // Validasi ukuran file
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }

    // Validasi tipe file
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setLocalError('Format file tidak didukung. Gunakan PDF, JPG, atau PNG');
      return;
    }

    setFileName(file.name);
    onChange(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSet(e.target.files?.[0] || null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSet(e.dataTransfer.files?.[0] || null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    setLocalError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayError = error || localError;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200 min-h-[120px]
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : fileName
              ? 'border-green-400 bg-green-50'
              : displayError
                ? 'border-red-400 bg-red-50'
                : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input
          ref={inputRef}
          id={fieldId}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        {fileName ? (
          /* State: File sudah dipilih */
          <div className="flex items-center gap-3 w-full">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700 truncate">{fileName}</p>
              <p className="text-xs text-green-500">File siap diupload</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          /* State: Belum ada file */
          <>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                Klik untuk upload atau drag & drop
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                PDF, JPG, JPEG, PNG (maks. {maxSizeMB}MB)
              </p>
            </div>
          </>
        )}
      </div>

      {displayError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {displayError}
        </p>
      )}
    </div>
  );
}
