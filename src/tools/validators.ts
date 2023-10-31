import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { Observable, of } from "rxjs";
import { IUser } from "src/app/modules/user-pages/models/users";

export function usernameExistsValidator(users: IUser[], user:IUser) {
    return (control: AbstractControl): ValidationErrors | null => {
      const username = control.value;

      if (username !== user.username) {
        if (username === undefined || username === '') {
          return null; // Пустое значение считается допустимым
        }

        const usernameExists = users.find((u) => u.username === username);

        if (usernameExists !== undefined) {
          return { usernameExists: true }; // Устанавливаем ошибку с именем 'usernameExists'
        }
      }

      return null; // Имя пользователя допустимо
    };
}
  

 
 export function customPatternValidator(pattern: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isValid = pattern.test(control.value);
      return isValid ? null : { customPattern: { value: control.value } };
    };
}
    export function customLinkPatternValidator(pattern: RegExp): ValidatorFn {
    return (
      control: AbstractControl,
    ): Observable<{ [key: string]: any } | null> => {
      if (control.value !== '') {
        const isValid = pattern.test(control.value);
        return isValid
          ? of(null)
          : of({ customPattern: { value: control.value } });
      } else return of(null);
    };
}
  

  export function emailExistsValidator(users:IUser[]) {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value;

        if (email === undefined || email === '') {
          return null; // Пустое значение считается допустимым
        }

        const emailExists = users.find((u) => u.email === email);

        if (emailExists !== undefined) {
          return { emailExists: true }; // Устанавливаем ошибку с именем 'usernameExists'
        }
      else {return null}

    };
}
  

  export function usernameAndEmailNotExistsValidator(users: IUser[]) {
    return (control: AbstractControl): ValidationErrors | null => {
      const login = control.value;

      if (login === undefined || login === '') {
        return null; // Пустое значение считается допустимым
      }

      const loginExists = users.find((u) => u.email === login || u.username === login);

      if (loginExists === undefined) {
        return { loginExists: true }; // Устанавливаем ошибку с именем 'usernameExists'
      } else {
        return null;
      }
    };
  }