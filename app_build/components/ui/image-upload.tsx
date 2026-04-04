'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  bucket: string;
  userId: string;
  maxFiles?: number;
  maxSizeMB?: number;
  existingUrls?: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUpload({ bucket, userId, maxFiles = 5, maxSizeMB = 5, existingUrls = [], onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<string[]>(existingUrls);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxFiles - urls.length;
    if (remaining <= 0) return;

    setUploading(true);
    const supabase = createClient();
    const newUrls: string[] = [...urls];

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > maxSizeMB * 1024 * 1024) continue;

      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
    }

    setUrls(newUrls);
    onChange(newUrls);
    setUploading(false);
  };

  const handleRemove = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
    onChange(newUrls);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div key={i} className="relative group">
            <img src={url} alt={`Upload ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border" />
            <button
              onClick={() => handleRemove(i)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
        {urls.length < maxFiles && (
          <label className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            <span className="text-2xl text-muted-foreground">+</span>
          </label>
        )}
      </div>
      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
      <p className="text-xs text-muted-foreground">{urls.length}/{maxFiles} images (max {maxSizeMB}MB each)</p>
    </div>
  );
}
