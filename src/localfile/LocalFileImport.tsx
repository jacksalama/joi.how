import { useCallback, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useImages } from '../settings';
import { ImageServiceType } from '../types';
import { getThumbnail, mimeToImageType, supportedImageTypes } from './utils';
import { LocalFileStore } from './LocalFileStore';

const StyledLocalFileImport = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Dropbox = styled.div`
  border: 2px dashed var(--button-background);
  border-radius: var(--border-radius);
  padding: 16px;
  text-align: center;
  cursor: pointer;

  &:hover {
    background: var(--button-background);
    color: var(--button-color);
  }
`;

// TODO: persist file handes using IndexedDB: https://web.dev/file-system-access/    https://stackoverflow.com/questions/64856292/persist-file-descriptor-across-page-reload-in-chrome-with-filesystemfilehandle
const ActualLocalFileImport = () => {
  const store = useMemo(() => new LocalFileStore(), []);

  const [, setImages] = useImages();

  const handleFileHandle = useCallback(
    async (fileHandle: FileSystemFileHandle) => {
      const file = await fileHandle.getFile();

      const url = URL.createObjectURL(file);

      const id = crypto.randomUUID();

      const image = {
        thumbnail: '',
        preview: url,
        full: url,
        type: mimeToImageType(file.type),
        source: file.name,
        service: ImageServiceType.local,
        id,
      };

      setImages(images => [...images, image]);

      // Save the file handle to preserve it across page reloads
      await store.set(id, fileHandle);

      // Create a thumbnail (delegate to async IIFE to avoid blocking the main promise)
      void (async () => {
        const thumbnail = await getThumbnail(file);
        image.thumbnail = thumbnail;
        setImages(images => {
          const index = images.findIndex(i => i.id === id);
          if (index === -1) return images;

          return images.toSpliced(index, 1, {
            ...images[index],
            thumbnail,
          });
        });
      })();
    },
    [setImages, store]
  );

  const handleClick = useCallback(async () => {
    try {
      const fileHandles = await window.showOpenFilePicker({
        multiple: true,
        types: Object.entries(supportedImageTypes).map(
          ([description, accept]) => ({
            description,
            accept: {
              [description]: accept,
            },
          })
        ),
      });

      const promises = fileHandles.map(handleFileHandle);
      await Promise.allSettled(promises);
    } catch (e) {
      console.error(e);
      // TODO: there's probably error handling somewhere in the app that could be used here
      alert('Error importing file: ' + e);
    }
  }, [handleFileHandle]);

  const dropboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dropbox = dropboxRef.current;
    if (!dropbox) return;

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      const items = event.dataTransfer!.items;
      const handles = await Promise.all(
        Array.from(items).map(item => item.getAsFileSystemHandle())
      );
      const fileHandles = (
        await Promise.all(
          handles.map(async handle => {
            if (handle instanceof FileSystemFileHandle) return [handle];
            else if (handle instanceof FileSystemDirectoryHandle) {
              const arr: FileSystemFileHandle[] = [];
              const handleDir = async (dir: FileSystemDirectoryHandle) => {
                for await (const entry of dir.values()) {
                  console.log(entry);
                  if (entry instanceof FileSystemFileHandle) arr.push(entry);
                  else if (entry instanceof FileSystemDirectoryHandle)
                    await handleDir(entry);
                }
              };

              await handleDir(handle);

              return arr;
            } else return [];
          })
        )
      ).flat();

      const promises = fileHandles.map(handleFileHandle);
      await Promise.allSettled(promises);
    };

    dropbox.addEventListener('dragover', handleDragOver);
    dropbox.addEventListener('drop', handleDrop);

    return () => {
      dropbox.removeEventListener('dragover', handleDragOver);
      dropbox.removeEventListener('drop', handleDrop);
    };
  }, [handleFileHandle]);

  return (
    <StyledLocalFileImport>
      <p>
        Make sure to allow the app to read local files from your browser
        settings -- or you'll be required to re-import them every time you
        reload the page.
      </p>
      <Dropbox onClick={handleClick} ref={dropboxRef}>
        Drop files here
      </Dropbox>
    </StyledLocalFileImport>
  );
};

export const LocalFileImport = () => {
  const supportError = useRef(
    !window.isSecureContext
      ? 'This feature is only available in secure contexts (https)'
      : !window.showOpenFilePicker
        ? 'File System Access API not supported in your browser'
        : undefined
  );

  return supportError.current ?? <ActualLocalFileImport />;
};
