export function mapChapterImage(image) {
  if (!image) return image;
  return {
    ...image,
    url: image.url && image.url.startsWith('data:')
      ? `/api/images/${image.id}`
      : image.url
  };
}

export function mapChapter(chapter) {
  if (!chapter) return chapter;
  return {
    ...chapter,
    comic: chapter.comic ? mapComic(chapter.comic) : undefined,
    images: chapter.images ? chapter.images.map(mapChapterImage) : undefined
  };
}

export function mapComic(comic) {
  if (!comic) return comic;
  return {
    ...comic,
    thumbnail: comic.thumbnail && comic.thumbnail.startsWith('data:')
      ? `/api/comics/${comic.id}/thumbnail`
      : comic.thumbnail,
    chapters: comic.chapters ? comic.chapters.map(mapChapter) : undefined
  };
}
