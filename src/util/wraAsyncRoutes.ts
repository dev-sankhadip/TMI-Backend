import { Router } from "express";
import { asyncErrorHandler } from "./asyncErrorHandler";
import { ILayer } from "express-serve-static-core";

export const wrapAsyncRoutes = (router: Router) => {
  router.stack.forEach((layer: ILayer) => {
    if (layer.route) {
      layer.route.stack.forEach((routeHandler: ILayer) => {
        routeHandler.handle = asyncErrorHandler(routeHandler.handle);
      });
    }
  });
};
