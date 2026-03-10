/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { db, storage } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const generateShortKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage('');
      setUploadedUrl('');
    }
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setMessage('Uploading...');
    setUploadedUrl('');

    try {
      const shortKey = generateShortKey();
      const storageRef = ref(storage, `files/${shortKey}-${file.name}`);
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      await setDoc(doc(db, 'files', shortKey), {
        shortKey,
        originalName: file.name,
        storagePath: storageRef.fullPath,
        createdAt: serverTimestamp(),
      });

      // Construct short URL
      const shortUrl = `${window.location.origin}/f/${shortKey}`;
      setMessage('File uploaded successfully!');
      setUploadedUrl(shortUrl);
      setFile(null);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      console.error(error);
      setMessage('Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Permanent File Uploader</h1>
      <input type="file" onChange={handleFileChange} className="mb-4 block" />
      <button 
        onClick={handleUpload} 
        disabled={!file || isUploading}
        className={`px-4 py-2 rounded text-white ${!file || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p className="mt-4">{message}</p>}
      {uploadedUrl && (
        <div className="mt-4">
          <p>Permanent Short URL:</p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  );
}

