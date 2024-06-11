import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../modules/authentication/services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.error instanceof ErrorEvent) {
          // Ошибка клиента
        } else {
          if (error.status === 404) {
            return EMPTY;
          }
          // if (error.status === 0) {
          //   this.authService.loadingSubject.next(false);
          //   this.authService.errorSubject.next(error);
          //   // Потом сделать next только при этом
          // }
        }
        return throwError(error);
      }),
    );
  }
}
