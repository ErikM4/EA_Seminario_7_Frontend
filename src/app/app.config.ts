import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

//================================
import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './services/auth.service';
//================================

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

//================================
function initializeApp(auth: AuthService) {
  return () =>
    firstValueFrom(auth.refresh()).catch(() => {
      // Si la cookie no existe o no es válida, la app arranca sin sesión
    });
}
//================================

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parámetros de la ruta (como :id) y los de la URL (?returnUrl=)
    // llegan a los componentes como inputs
    provideRouter(routes, withComponentInputBinding()),
    // withInterceptors: todas las peticiones de HttpClient pasan por authInterceptor,
    // que les añade el token (ver interceptors/auth.interceptor.ts)
    provideHttpClient(withInterceptors([authInterceptor])),
    
//================================
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true,
    },
//================================
  ],
};