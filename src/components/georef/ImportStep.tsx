import { useCallback, useState } from 'react';
import { Upload, FileImage, Image, AlertCircle } from 'lucide-react';
import { useGeorefStore } from '@/stores/georefStore';
import { importImage, importImageFromPath } from '@/services/image/ImageService';

export function ImportStep() {
  const { image, setImage, setStep } = useGeorefStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|tif|tiff|bmp|webp)$/i)) {
      setError('Unsupported file type. Use JPEG, PNG, TIFF, or BMP.');
      return;
    }

    try {
      setError(null);
      const imported = await importImage(file);
      setImage(imported);
    } catch (err) {
      setError(`Failed to import image: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [setImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleBrowse = useCallback(async () => {
    if (window.electronAPI) {
      const path = await window.electronAPI.openFile([
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'bmp', 'webp'] },
      ]);
      if (path) {
        try {
          const imported = await importImageFromPath(path);
          setImage(imported);
        } catch (err) {
          setError(`Failed to import: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.tif,.tiff';
      input.onchange = () => {
        if (input.files?.length) handleFiles(input.files);
      };
      input.click();
    }
  }, [handleFiles, setImage]);

  if (image) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-6">
        <div className="space-y-2 text-center">
          <FileImage size={40} className="mx-auto text-gis-teal/70" />
          <h2 className="text-lg font-semibold text-white">{image.fileName}</h2>
        </div>

        {/* Image preview */}
        <div className="relative max-w-2xl w-full">
          <img
            src={image.thumbnailDataUrl ?? image.dataUrl}
            alt="Imported image"
            className="rounded-xl border border-gis-border shadow-lg max-h-[400px] mx-auto object-contain"
          />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
          <MetaCard label="Size" value={`${image.metadata.width} × ${image.metadata.height}`} />
          <MetaCard label="Format" value={image.metadata.format.split('/')[1]?.toUpperCase() ?? 'Unknown'} />
          <MetaCard label="File size" value={formatFileSize(image.metadata.fileSize)} />
          <MetaCard label="DPI" value={image.metadata.dpi?.toString() ?? 'N/A'} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setImage(null)}
            className="px-4 py-2 text-sm rounded-lg border border-gis-border text-white/60 hover:bg-gis-deep-blue/30 transition-colors"
          >
            Replace Image
          </button>
          <button
            onClick={() => setStep('analyze')}
            className="px-4 py-2 text-sm rounded-lg bg-gis-teal/20 text-gis-teal-light hover:bg-gis-teal/30 transition-colors font-medium"
          >
            Analyze Image →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-white">Import Image</h2>
          <p className="text-xs text-white/40">
            Drop a scanned map, aerial image, field sketch, or any image with coordinate clues.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={handleBrowse}
          className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            isDragOver
              ? 'border-gis-teal bg-gis-teal/10'
              : 'border-gis-border hover:border-gis-deep-blue hover:bg-gis-deep-blue/10'
          }`}
        >
          <Upload size={40} className={`${isDragOver ? 'text-gis-teal' : 'text-white/20'} transition-colors`} />
          <p className="text-sm text-white/60 mt-4">
            {isDragOver ? 'Release to import' : 'Drag & drop your image here'}
          </p>
          <p className="text-xs text-white/30 mt-1">or click to browse</p>
          <div className="flex gap-2 mt-3">
            {['JPEG', 'PNG', 'TIFF', 'BMP'].map((fmt) => (
              <span key={fmt} className="text-[9px] px-1.5 py-0.5 bg-gis-deep-blue/30 rounded text-white/30">
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gis-surface border border-gis-border rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-white/30 uppercase">{label}</p>
      <p className="text-xs text-white/80 font-medium mt-0.5">{value}</p>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
