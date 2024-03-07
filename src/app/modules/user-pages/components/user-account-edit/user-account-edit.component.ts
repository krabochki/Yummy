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

import {
  customPatternValidator,
  customLinkPatternValidator,
} from 'src/tools/validators';
import { steps, Step } from './consts';
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
  Validators,
} from '@angular/forms';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { INotification } from '../../models/notifications';
import { addModalStyle, removeModalStyle } from 'src/tools/common';
import {
  EMPTY,
  Observable,
  catchError,
  finalize,
  forkJoin,
  of,
  tap,
} from 'rxjs';
@Component({
  selector: 'app-user-account-edit',
  templateUrl: './user-account-edit.component.html',
  styleUrls: ['./user-account-edit.component.scss'],
  animations: [trigger('modal', modal()), trigger('height', heightAnim())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccountEditComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  editableUser: IUser = { ...nullUser };
  @Output() closeEmitter = new EventEmitter<boolean>();
  @Output() editEmitter = new EventEmitter<boolean>();
  @Input() userId: number = 0;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  viewedSteps: number[] = [];

  loading = false;

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;

  private newUser: IUser = { ...nullUser };

  currentStep: number = 0;

  showInfo: boolean = false;
  steps: Step[] = steps;

  showedUserpicImage: string = '';
  noUserpicImage: string = '/assets/images/add-userpic.png';

  form: FormGroup;
  beginningData: any;

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private notifyService: NotificationService,
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
          customPatternValidator(usernameMask),
        ],
      ],
      fullname: [this.newUser.fullName, [Validators.maxLength(30)]],
      quote: [this.newUser.quote, [Validators.maxLength(500)]],
      description: ['', [Validators.maxLength(2000)]],
      location: ['', [Validators.maxLength(30)]],
      website: [
        '',
        [Validators.maxLength(1000)],
        customLinkPatternValidator(anySiteMask),
      ],
      twitter: [
        '',
        [Validators.maxLength(1000)],
        customLinkPatternValidator(twitterMask),
      ],
      facebook: [
        '',
        [Validators.maxLength(1000)],
        customLinkPatternValidator(facebookMask),
      ],
      vk: [
        '',
        [Validators.maxLength(1000)],
        customLinkPatternValidator(vkMask),
      ],
      pinterest: [
        '',
        [Validators.maxLength(1000)],
        customLinkPatternValidator(pinterestMask),
      ],
      userpic: [null],
    });
  }
  birthDate: Date | null = null;

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.scrollTop();
    }
  }

  addViewedStep(i: number) {
    if (!this.viewedSteps.includes(i)) {
      this.viewedSteps.push(i);
    }
  }

  notValid() {
    return this.validNextSteps();
  }
  clickOnCircleStep(i: number) {
    if (this.validNextSteps() === 0 || this.validNextSteps() > i) {
      this.currentStep = i;
      this.addViewedStep(this.currentStep);

      this.scrollTop();
    }
  }

  buttonDisabled() {
    return (
      this.currentStep === this.validNextSteps() - 1 ||
      this.currentStep === steps.length - 1
    );
  }

  noValidStepDescription(step: number): string {
    switch (step) {
      case 0:
        return 'Имя пользователя не должно быть занято и должно содержать только допустимые символы и содержать как минимум 4 символа';
      case 1:
        return 'Ссылка на личный сайт должна быть корректной ссылкой на сайт в Интернете';
      case 2:
        return 'Ссылки на соц. сети должны быть корректными ссылками на сайты в Интернете';
    }
    return '';
  }

  validNextSteps(): number {
    for (let s = 0; s <= 2; s++) {
      switch (s) {
        case 0:
          if (
            !this.form.get('username')!.valid ||
            !this.form.get('fullname')!.valid
          ) {
            return 1;
          }
          break;
        case 1:
          if (
            (!this.form.get('quote')!.valid ||
              !this.form.get('location')!.valid ||
              !this.form.get('description')!.valid ||
              !this.form.get('website')!.valid) &&
            this.viewedSteps.includes(1)
          ) {
            return 2;
          }
          break;
        case 2:
          if (
            (!this.form.get('facebook')!.valid ||
              !this.form.get('pinterest')!.valid ||
              !this.form.get('vk')!.valid ||
              !this.form.get('twitter')!.valid) &&
            this.viewedSteps.includes(2)
          ) {
            return 3;
          }
          break;
      }
    }
    return 0;
  }

  scrollTop(): void {
    if (this.scrollContainer) this.scrollContainer.nativeElement.scrollTop = 0;
  }
  goToNextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.addViewedStep(this.currentStep);

      this.scrollTop();
    }
  }

  currentUser: IUser = nullUser;
  ngOnInit() {
    addModalStyle(this.renderer);
    this.authService.currentUser$.subscribe((currentUser) => {
      this.currentUser = currentUser;
    });
    this.loading = true;
    this.userService.getUserForEdit(this.userId).subscribe((user) => {
      this.editableUser = user;

      user.quote = user.quote || '';
      user.fullName = user.fullName || '';
      user.description = user.description || '';
      user.location = user.location || '';
      user.quote = user.quote || '';
      user.personalWebsite = user.personalWebsite || '';

      this.form.get('username')?.setValue(user.username);
      this.form.get('quote')?.setValue(user.quote);
      this.form.get('fullname')?.setValue(user.fullName);
      this.form.get('website')?.setValue(user.personalWebsite);
      this.form.get('description')?.setValue(user.description);
      this.birthDate = user.birthday ? new Date(user.birthday) : null;
      this.form.get('location')?.setValue(user.location);
      user.socialNetworks = user.socialNetworks || [];
      for (const network of user.socialNetworks) {
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

      if (user.image) {
        this.userService
          .downloadUserpic(user.image)
          .pipe(
            tap((blob) => {
              user.avatarUrl = URL.createObjectURL(blob);
              this.showedUserpicImage = user.avatarUrl;
              this.form.get('userpic')?.setValue('userpic');
            }),
            catchError(() => {
              this.showedUserpicImage = this.noUserpicImage;
              return EMPTY;
            }),

            finalize(() => {
              this.loading = false;
              addModalStyle(this.renderer);
              this.cdr.markForCheck();
              this.beginningData = this.form.getRawValue();
            }),
          )
          .subscribe();
      } else {
        this.loading = false;
        this.showedUserpicImage = this.noUserpicImage;
        this.beginningData = this.form.getRawValue();
        this.cdr.markForCheck();
      }
    });
  }

  onUserpicChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('userpic')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.showedUserpicImage = objectURL;
    }
  }

  unsetImage() {
    this.form.get('userpic')?.setValue(null);
    this.showedUserpicImage = this.noUserpicImage;
  }

  //проверяем равны ли все поля в обьектах
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  areObjectsEqual(): boolean {
    if (
      this.birthDate &&
      this.birthDate.toString() !=
        new Date(this.editableUser.birthday).toString()
    )
      return true;
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

    this.newUser = {
      ...this.editableUser,
      username: this.form.value.username,
      birthday: this.birthDate ? this.birthDate.toJSON() : '',
      fullName: this.form.value.fullname,
      quote: this.form.value.quote,
      personalWebsite: this.form.value.website,
      description: this.form.value.description,
      location: this.form.value.location,
      socialNetworks: socialNetworks,
    };

    this.putUser();
  }

  image: string = '';

  putImages(): {
    loadImage: Observable<any>;
    deleteImage: Observable<any>;
  } {
    const loadImage =
      this.form.get('userpic')?.value &&
      this.form.get('userpic')?.value !== 'userpic';
    const deleteImage =
      this.editableUser.image && this.form.get('userpic')?.value !== 'userpic';

    let loadImage$: Observable<any> = of(null);
    let deleteImage$: Observable<any> = of(null);
    if (loadImage) {
      loadImage$ = this.userService
        .uploadUserpic(this.form.get('userpic')?.value)
        .pipe(
          tap((file: any) => {
            this.image = file.filename;
          }),
        );
    }
    if (deleteImage) {
      deleteImage$ = this.userService.deleteUserpic(this.editableUser.image!);
    }

    return {
      loadImage: loadImage$,
      deleteImage: deleteImage$,
    };
  }

  putUser() {
    const putUser$ = this.userService
      .updatePublicUser(this.newUser.id, this.newUser)
      .pipe(
        tap(() => {
          if (this.editableUser.username !== this.newUser.username) {
            this.authService.logout().subscribe(() => {
              this.authService.changeToken(this.newUser.username).subscribe(
                (res) => {
                  console.log(res)
                }
              );
            });
          }
          const images$ = this.putImages();
          forkJoin(images$)
            .pipe(
              finalize(() => {
                if (
                  this.form.get('userpic')?.value &&
                  this.form.get('userpic')?.value !== 'userpic'
                ) {
                  this.userService
                    .updateUserpic(this.userId, this.image)
                    .pipe(
                      finalize(() => {
                        this.successModal = true;
                        this.cdr.markForCheck();
                      }),
                    )
                    .subscribe();
                } else {
                  this.successModal = true;

                  this.cdr.markForCheck();
                }
              }),
            )
            .subscribe();
        }),
        catchError((response) => {
          this.error = response.error || this.error;
          this.errorModal = true;
          this.cdr.markForCheck();
          return EMPTY;
        }),
      );

    putUser$.subscribe();
  }

  handleErrorModal() {
    this.errorModal = false;
    addModalStyle(this.renderer);
  }

  error: string =
    'Произошла неизвестная ошибка при попытке обновить данные пользователя';
  errorModal: boolean = false;
  handleSaveModal(answer: boolean) {
    if (answer) {
      this.updateUser();
    }
    addModalStyle(this.renderer);
    this.saveModal = false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleSuccessModal(answer: boolean) {
    this.closeEmitter.emit(true);
    this.editEmitter.emit(true);
    this.successModal = false;

   // if (this.userService.getPermission('you-edit-your-account', this.newUser)) {
      const notify: INotification = this.notifyService.buildNotification(
        'Профиль изменен',
        'Вы успешно изменили свой профиль',
        'success',
        'user',
        '/cooks/list/' + this.newUser.id,
      );
      this.notifyService
        .sendNotification(notify, this.newUser.id, true)
        .subscribe();
    
  }
  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      addModalStyle(this.renderer);
    }
    this.closeModal = false;
  }

  closeEditModal() {
    this.areObjectsEqual()
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.areObjectsEqual()
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }

  ngOnDestroy(): void {
    removeModalStyle(this.renderer);
  }
}
