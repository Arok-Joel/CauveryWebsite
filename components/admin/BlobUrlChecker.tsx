'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isBlobUrl } from '@/lib/blob-helpers';

export function BlobUrlChecker() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<{ isBlob: boolean; message: string } | null>(null);

  const handleCheck = () => {
    if (!inputValue.trim()) return;
    
    const isBlob = isBlobUrl(inputValue);
    setResult({
      isBlob,
      message: isBlob 
        ? 'This is a Blob Storage URL'
        : 'This is NOT a Blob Storage URL'
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Image URL Analysis</h3>
        <p className="text-sm text-gray-500 mb-4">
          Enter any URL or path to check if it's a Blob Storage URL
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter image URL or path"
            className="flex-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <Button 
            onClick={handleCheck}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Check
          </Button>
        </div>
        
        {result && (
          <div className="mt-3 p-3 rounded border" style={{
            borderColor: result.isBlob ? '#22c55e' : '#eab308',
            backgroundColor: result.isBlob ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)'
          }}>
            <p className="font-medium" style={{
              color: result.isBlob ? '#16a34a' : '#ca8a04'
            }}>
              {result.isBlob ? '✓ ' : '× '} 
              {result.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 