
import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { steps,Step } from './consts';
import { usernameMask } from 'src/tools/regex';
import { IUser, nullUser, SocialNetwork } from '../../models/users';
import { trigger } from '@angular/animations';
import { heightAnim, modal } from 'src/tools/animations';
import {
  vkMask,
  facebookMask,
  twitterMask,
  pinterestMask,
  anySiteMask,
} from 'src/tools/regex';
import { UserService } from '../../services/user.service';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';

@Component({
  selector: 'app-user-account-edit',
  templateUrl: './user-account-edit.component.html',
  styleUrls: ['./user-account-edit.component.scss'],
  animations: [trigger('modal', modal()),trigger('height',heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccountEditComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  @Input() editableUser: IUser = { ...nullUser };
  @Output() closeEmitter = new EventEmitter<boolean>();

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  newUser: IUser = { ...nullUser };
  users: IUser[] = [];

  myImage: string = '';
  defaultImage: string = '../../../../../assets/images/add-userpic.png';
  form: FormGroup;
  beginningData: any;

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      username: [
        this.newUser.username,
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
          this.customPatternValidator(usernameMask),
          this.usernameExistsValidator(),
        ],
      ],
      fullname: [this.newUser.fullName, [Validators.maxLength(30)]],
      quote: [this.newUser.quote, [Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(2000)]],
      location: ['', [Validators.maxLength(30)]],
      website: [
        '',
        [Validators.maxLength(1000)],
        this.customLinkPatternValidator(anySiteMask),
      ],
      twitter: [
        '',
        [Validators.maxLength(1000)],
        this.customLinkPatternValidator(twitterMask),
      ],
      facebook: [
        '',
        [Validators.maxLength(1000)],
        this.customLinkPatternValidator(facebookMask),
      ],
      vk: [
        '',
        [Validators.maxLength(1000)],
        this.customLinkPatternValidator(vkMask),
      ],
      pinterest: [
        '',
        [Validators.maxLength(1000)],
        this.customLinkPatternValidator(pinterestMask),
      ],
      userpic: [null],
    });
  }

  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  currentStep: number = 0;

  showInfo = false;

  steps: Step[] = steps;

  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;

      this.scrollTop();
    }
  }
  scrollTop(): void {
    if (this.scrollContainer) this.scrollContainer.nativeElement.scrollTop = 0;
  }
  goToNextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.scrollTop();
    }
  }
  

  //Валидатор по маске regex для формы
  customLinkPatternValidator(pattern: RegExp): ValidatorFn {
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
  customPatternValidator(pattern: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isValid = pattern.test(control.value);
      return isValid ? null : { customPattern: { value: control.value } };
    };
  }

  ngOnInit() {
    this.renderer.addClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width =
      'calc(100% - 16px)';
    this.renderer.addClass(document.body, 'hide-overflow');
    this.newUser = { ...this.editableUser };
    this.form.get('username')?.setValue(this.newUser.username);
    this.form.get('quote')?.setValue(this.newUser.quote);
    this.form.get('fullname')?.setValue(this.newUser.fullName);
    this.form.get('description')?.setValue(this.newUser.description);
    this.form.get('location')?.setValue(this.newUser.location);
    this.form.get('website')?.setValue(this.newUser.personalWebsite);
    for (const network of this.newUser.socialNetworks) {
      switch (network.name) {
        case 'pinterest':
          this.form.get('pinterest')?.setValue(network.link);
          break;
        case 'facebook':
          this.form.get('facebook')?.setValue(network.link);
          break;
        case 'twitter':
          this.form.get('twitter')?.setValue(network.link);
          break;
        case 'ВКонтакте':
          this.form.get('vk')?.setValue(network.link);
          break;
      }
    }

    if (this.newUser.avatarUrl !== null) {
      try {
        const mainImageData: FormData = this.newUser.avatarUrl;
        const mainpicFile = mainImageData.get('file') as File;
        if (mainpicFile) {
          this.form.get('image')?.setValue(mainImageData);
          const objectURL = URL.createObjectURL(mainpicFile);
          this.myImage = objectURL;
        }
      } catch (error) {}
    }

    this.beginningData = this.form.getRawValue();

    this.userService.users$.subscribe((data: IUser[]) => {
      this.users = data;
    });
    this.cdr.markForCheck()
    this.myImage = this.defaultImage;
  }

  onUserpicChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('userpic')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.myImage = objectURL;
    }
  }

  usernameExistsValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const username = control.value;

      if (username !== this.editableUser.username) {
        if (username === undefined || username === '') {
          return null; // Пустое значение считается допустимым
        }

        const usernameExists = this.users.find((u) => u.username === username);

        if (usernameExists !== undefined) {
          return { usernameExists: true }; // Устанавливаем ошибку с именем 'usernameExists'
        }
      }

      return null; // Имя пользователя допустимо
    };
  }

  //проверяем равны ли все поля в обьектах
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  areObjectsEqual(): boolean {
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  updateUser() {
    const socialNetworks: SocialNetwork[] = [];

    const socialNetworksData: SocialNetwork[] = [
      { name: 'pinterest', link: this.form.value.pinterest },
      { name: 'facebook', link: this.form.value.facebook },
      { name: 'twitter', link: this.form.value.twitter },
      { name: 'ВКонтакте', link: this.form.value.vk },
    ];

    for (const data of socialNetworksData) {
      if (data.link !== '') {
        socialNetworks.push(data);
      }
    }

    const userpicData = new FormData();
    userpicData.append('image', this.form.get('userpic')?.value);

    this.newUser = {
      ...this.editableUser,

      username: this.form.value.username,
      fullName: this.form.value.fullname,
      avatarUrl: userpicData,
      quote: this.form.value.quote,
      personalWebsite: this.form.value.website,
      description: this.form.value.description,
      location: this.form.value.location,
      socialNetworks: socialNetworks,
    };

    this.userService.updateUsers(this.newUser).subscribe(
      () => {
        this.authService.loginUser(this.newUser).subscribe((user) => {
          if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.authService.setCurrentUser(user);
            this.successModal = true;
          }
          (error: Error) => {
            console.error(
              'Изменение пользователя | Ошибка при авторизации обновленного пользователя: ' +
                error.message,
            );
          };
        });
      },
      (error: Error) => {
        console.error(
          'Изменение пользователя | Ошибка при обновлении пользователя: ' +
            error.message,
        );
      },
    );
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.updateUser();
      this.successModal = true;
    }
      setTimeout(() => {
        this.renderer.addClass(document.body, 'hide-overflow');
        (<HTMLElement>document.querySelector('.header')).style.width =
          'calc(100% - 16px)';
      }, 0);
    this.saveModal = false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleSuccessModal(answer: boolean) {
    this.closeEmitter.emit(true);

    this.successModal = false;
  }
  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    }
      setTimeout(() => {
        this.renderer.addClass(document.body, 'hide-overflow');
        (<HTMLElement>document.querySelector('.header')).style.width =
          'calc(100% - 16px)';
      }, 0);
    this.closeModal = false;
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.areObjectsEqual()
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }
  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }
}
