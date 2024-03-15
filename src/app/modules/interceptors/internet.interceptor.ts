import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class InternetInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // Проверяем, есть ли интернет соединение
    if (!navigator.onLine) {
      console.log('Отсутствует интернет соединение');
      // Можно здесь обработать ситуацию, когда интернет отсутствует
      // Например, вывести сообщение об ошибке или выполнить другие действия
    }

    // Продолжаем выполнение запроса, если интернет есть
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Здесь можно обработать другие ошибки HTTP
        return throwError(error);
      }),
    );
  }
}
