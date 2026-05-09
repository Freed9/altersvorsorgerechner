import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes, RenderMode, ServerRoute } from '@angular/ssr';
import { provideRouter } from '@angular/router';
import { appConfig } from './app.config';

const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Prerender },
];

const serverConfig: ApplicationConfig = {
  providers: [
    provideRouter([]),
    provideServerRendering(withRoutes(serverRoutes)),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
