import { ImageType } from '../types';

const THUMBNAIL_SIZE = 512;

/**
 * Generates a thumbnail image from the provided file.
 * Supports both image and video files.
 *
 * @param file - The file from which to generate the thumbnail.
 * @returns The generated thumbnail image as a data URL.
 * @throws {Error} If the file type is not supported.
 */
export const getThumbnail = async (file: File) => {
  const url = URL.createObjectURL(file);

  const media = await (async () => {
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = url;
      video.currentTime = 1;

      video.load();

      // Wait for the video to start loading first frames
      await new Promise((resolve, reject) => {
        video.oncanplay = resolve;
        video.onerror = reject;
      });

      video.width = video.videoWidth;
      video.height = video.videoHeight;

      return video;
    } else if (file.type.startsWith('image/')) {
      const image = document.createElement('img');
      image.src = url;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      return image;
    } else {
      throw new Error('Unsupported file type: ' + file.type);
    }
  })();

  const [width, height] = (() => {
    if (media.width > media.height) {
      return [THUMBNAIL_SIZE, (media.height * THUMBNAIL_SIZE) / media.width];
    } else {
      return [(media.height * THUMBNAIL_SIZE) / media.height, THUMBNAIL_SIZE];
    }
  })();

  media.width = width;
  media.height = height;

  const canvas = document.createElement('canvas');
  canvas.width = media.width;
  canvas.height = media.height;
  const context = canvas.getContext('2d');
  context!.drawImage(media, 0, 0, media.width, media.height);
  const thumbnail = canvas.toDataURL('image/webp');

  URL.revokeObjectURL(url);

  return thumbnail;
};

/**
 * Converts a MIME type to an image type.
 * @param mime - The MIME type to convert.
 * @returns The corresponding image type.
 * @throws {Error} If the file type is not supported.
 */
export const mimeToImageType = (mime: string) => {
  if (mime.startsWith('image/gif')) {
    return ImageType.gif;
  } else if (mime.startsWith('image/')) {
    return ImageType.image;
  } else if (mime.startsWith('video/')) {
    return ImageType.video;
  } else {
    throw new Error('Unsupported file type: ' + mime);
  }
};

export const supportedImageTypes: NonNullable<FilePickerAcceptType['accept']> =
  {
    'image/*': [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.webp',
      '.avif',
      '.jfif',
      '.svg',
    ],

    'video/*': ['.mp4', '.webm', '.mkv'], // TODO: check if mkv works, and add more video formats
  };
