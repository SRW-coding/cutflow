import type { TimelineItem } from '@/types/timeline';
import type { MediaMetadata } from '@/types/storage';
import { createLogger } from '@/shared/logging/logger';
import { mapWithConcurrency } from '@/shared/async/async-utils';
import { findNearestAvailableSpace, type CollisionRect } from './collision-utils';
import {
  buildDroppedMediaTimelineItem,
  getDroppedMediaDurationInFrames,
  type DroppableMediaType,
} from './dropped-media';
import { resolveMediaUrl } from '../deps/media-library-resolver';
import { mediaLibraryService } from '../deps/media-library-service';

const logger = createLogger('PlaceImportedMedia');

export interface MediaPlacementEntry {
  media: MediaMetadata;
  mediaId: string;
  mediaType: DroppableMediaType;
  label: string;
}

const MULTI_DROP_METADATA_CONCURRENCY = 3;

/**
 * Resolves blob URLs and builds timeline items for imported library media on a single track,
 * using the same placement rules as timeline drag-drop from the media library.
 */
export async function buildTimelineItemsForMediaOnTrack(
  entries: MediaPlacementEntry[],
  context: {
    trackId: string;
    dropFrame: number;
    fps: number;
    canvasWidth: number;
    canvasHeight: number;
    existingItems: TimelineItem[];
  }
): Promise<TimelineItem[]> {
  const {
    trackId,
    dropFrame,
    fps,
    canvasWidth,
    canvasHeight,
    existingItems: storeItems,
  } = context;

  let currentPosition = Math.max(0, dropFrame);
  const reservedRanges: CollisionRect[] = [];

  type Planned = {
    entry: MediaPlacementEntry;
    finalPosition: number;
    itemDuration: number;
  };
  const plannedItems: Planned[] = [];

  for (const entry of entries) {
    const itemDuration = getDroppedMediaDurationInFrames(entry.media, entry.mediaType, fps);
    const itemsToCheck: CollisionRect[] = [...storeItems, ...reservedRanges];
    const finalPosition = findNearestAvailableSpace(
      currentPosition,
      itemDuration,
      trackId,
      itemsToCheck
    );

    if (finalPosition === null) {
      logger.warn('Cannot place item: no available space on track for', entry.label);
      continue;
    }

    plannedItems.push({
      entry,
      finalPosition,
      itemDuration,
    });
    reservedRanges.push({ from: finalPosition, durationInFrames: itemDuration, trackId });
    currentPosition = finalPosition + itemDuration;
  }

  if (plannedItems.length === 0) {
    return [];
  }

  const resolvedTimelineItems = await mapWithConcurrency(
    plannedItems,
    MULTI_DROP_METADATA_CONCURRENCY,
    async (planned): Promise<TimelineItem | null> => {
      const { entry, finalPosition, itemDuration } = planned;
      const needsThumbnail = entry.mediaType === 'video' || entry.mediaType === 'image';
      const [blobUrl, thumbnailUrl] = await Promise.all([
        resolveMediaUrl(entry.mediaId),
        needsThumbnail
          ? mediaLibraryService.getThumbnailBlobUrl(entry.mediaId)
          : Promise.resolve(null),
      ]);

      if (!blobUrl) {
        logger.error('Failed to get media blob URL for', entry.label);
        return null;
      }

      return buildDroppedMediaTimelineItem({
        media: entry.media,
        mediaId: entry.mediaId,
        mediaType: entry.mediaType,
        label: entry.label,
        timelineFps: fps,
        blobUrl,
        thumbnailUrl,
        canvasWidth,
        canvasHeight,
        placement: {
          trackId,
          from: finalPosition,
          durationInFrames: itemDuration,
        },
      });
    }
  );

  return resolvedTimelineItems.filter((item): item is TimelineItem => item !== null);
}
