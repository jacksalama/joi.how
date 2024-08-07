import { useEffect, useMemo } from 'react';
import { useImages } from '../settings';
import { ImageServiceType } from '../types';
import { LocalFileStore } from './LocalFileStore';

// This component--upon app load--will recover file handles stored in IndexedDB for local files
export const LocalFileLoader = () => {
  const store = useMemo(() => new LocalFileStore(), []);
  const [images, setImages] = useImages();

  useEffect(() => {
    (async () => {
      for (const image of images) {
        if (image.service !== ImageServiceType.local) continue;

        const fileHandle = await store.get(image.id);

        if (!fileHandle) continue;

        const currentPerm = await fileHandle.queryPermission({ mode: 'read' });
        if (currentPerm !== 'granted') {
          alert(
            'Some local files could not be loaded after the app was reloaded. Allow the app to always read local files from your browser settings.'
          );
          return;
        }

        const file = await fileHandle.getFile();
        const url = URL.createObjectURL(file);

        setImages(images =>
          images.map(i =>
            i.id === image.id
              ? {
                  ...i,
                  preview: url,
                  full: url,
                }
              : i
          )
        );
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
};
