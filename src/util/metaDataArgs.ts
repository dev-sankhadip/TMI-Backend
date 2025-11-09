export class MetadataArgsStorage {
  controllers: {
    target: new (...args: any[]) => any;
    baseRoute: string | undefined;
  }[] = [];
}
