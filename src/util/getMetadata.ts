import { MetadataArgsStorage } from './metaDataArgs';

export function getMetadataArgsStorage(): MetadataArgsStorage {
  if (!(global as any).routingControllersMetadataArgsStorage) {
    (global as any).routingControllersMetadataArgsStorage =
      new MetadataArgsStorage();
  }
  return (global as any).routingControllersMetadataArgsStorage;
}
