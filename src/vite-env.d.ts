/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    openFile: (filters?: Electron.FileFilter[]) => Promise<string | null>;
    saveFile: (defaultPath: string, filters?: Electron.FileFilter[]) => Promise<string | null>;
    readFile: (path: string) => Promise<ArrayBuffer>;
    writeFile: (path: string, data: ArrayBuffer) => Promise<void>;
    readTextFile: (path: string) => Promise<string>;
    writeTextFile: (path: string, content: string) => Promise<void>;
    getAppPath: () => Promise<string>;
    showItemInFolder: (path: string) => void;
    platform: string;
  };
}
