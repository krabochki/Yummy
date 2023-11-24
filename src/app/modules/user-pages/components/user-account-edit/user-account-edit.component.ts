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
import { createClient } from '@supabase/supabase-js';
import {
  supabaseUrl,
  supabaseKey,
  supabase,
} from 'src/app/modules/controls/image/supabase-data';

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
  @Input() editableUser: IUser = { ...nullUser };
  @Output() closeEmitter = new EventEmitter<boolean>();
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;

  private supabase = supabase;
  private supabaseFilepath: string = '';

  viewedSteps: number[] = [];

  loading = false;

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;

  private newUser: IUser = { ...nullUser };
  private users: IUser[] = [];

  currentStep: number = 0;

  showInfo: boolean = false;
  steps: Step[] = steps;

  showedUserpicImage: string = '';
  noUserpicImage: string = 'assets/images/add-userpic.png';

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
          this.usernameExistsValidator(),
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
    this.form.get('userpic')?.setValue(this.newUser.avatarUrl);
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

    this.userService.users$.subscribe((data: IUser[]) => {
      this.users = data;
    });

    if (this.editableUser.avatarUrl) {
      this.downloadUserpicFromSupabase(this.editableUser.avatarUrl);
      this.supabaseFilepath = this.editableUser.avatarUrl;
    } else {
      this.showedUserpicImage = this.noUserpicImage;
    }

    this.beginningData = this.form.getRawValue();
    this.cdr.markForCheck();
  }

  onUserpicChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const userpicFile: File | undefined = input.files?.[0];

    if (userpicFile) {
      this.form.get('userpic')?.setValue(userpicFile);
      const objectURL = URL.createObjectURL(userpicFile);
      this.showedUserpicImage = objectURL;
      this.supabaseFilepath = this.setUserpicFilenameForSupabase();
    }
  }

  unsetImage() {
    this.form.get('userpic')?.setValue(null);
    this.showedUserpicImage = this.noUserpicImage;
    this.supabaseFilepath = '';
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

    this.newUser = {
      ...this.editableUser,
      username: this.form.value.username,
      fullName: this.form.value.fullname,
      avatarUrl: this.form.value.userpic ? this.supabaseFilepath : undefined,
      quote: this.form.value.quote,
      personalWebsite: this.form.value.website,
      description: this.form.value.description,
      location: this.form.value.location,
      socialNetworks: socialNetworks,
    };

    if (this.editableUser.avatarUrl)
      this.deleteOldUserpic(this.editableUser.avatarUrl);

    this.updateUserInSupabase();
  }

  async updateSupabaseUser(user: IUser) {
    await this.userService.updateUserInSupabase(user);
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.updateUser();
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

    if (this.userService.getPermission('you-edit-your-account', this.newUser)) {
      const notify: INotification = this.notifyService.buildNotification(
        'Профиль изменен',
        'Твой профиль успешно изменен',
        'success',
        'user',
        '/cooks/list/' + this.newUser.id,
      );
      this.notifyService.sendNotification(notify, this.newUser);
    }
  }
  handleCloseModal(answer: boolean) {
    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      setTimeout(() => {
        this.renderer.addClass(document.body, 'hide-overflow');
        (<HTMLElement>document.querySelector('.header')).style.width =
          'calc(100% - 16px)';
      }, 0);
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
    this.renderer.removeClass(document.body, 'hide-overflow');
    (<HTMLElement>document.querySelector('.header')).style.width = '100%';
  }

  //работа с данными supabase

  private setUserpicFilenameForSupabase(): string {
    const file = this.form.get('userpic')?.value;
    const fileExt = file.name.split('.').pop();
    return `${Math.random()}.${fileExt}`;
  }

  downloadUserpicFromSupabase(path: string) {
    this.showedUserpicImage = this.supabase.storage
      .from('userpics')
      .getPublicUrl(path).data.publicUrl;
  }

  async updateUserInSupabase() {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const file = this.form.get('userpic')?.value;
      if (file) {
        const filePath = this.supabaseFilepath;
        await this.supabase.storage.from('userpics').upload(filePath, file);
      }
      await this.updateSupabaseUser(this.newUser);
      this.authService.loginUser(this.newUser).subscribe((user) => {
        if (user) {
          this.authService.setCurrentUser(user);
        }
      });
      this.successModal = true;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
  async deleteOldUserpic(path: string) {
    await this.supabase.storage.from('userpics').remove([path]);
  }
}
