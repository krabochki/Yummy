import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { IAchievement, achievementDescriptions } from '../models/achievement';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AchievementService } from '../services/achievement.service';
import { INotification } from 'src/app/modules/user-pages/models/notifications';
import { NotificationService } from 'src/app/modules/user-pages/services/notification.service';
import { addModalStyle } from 'src/tools/common';
import { modal } from 'src/tools/animations';
import { trigger } from '@angular/animations';
import { EMPTY, Subject, catchError, finalize, of, switchMap, takeUntil, tap } from 'rxjs';
import { IUser, nullUser } from 'src/app/modules/user-pages/models/users';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { checkFile } from 'src/tools/error.handler';
import { palette } from 'src/app/modules/planning/add-calendar-event/palette';
import { notNullValidator } from 'src/tools/validators';
import { Permission } from 'src/app/modules/user-pages/components/settings/conts';
import { UserService } from 'src/app/modules/user-pages/services/user.service';

const steps: Step[] = [
  {
    title: 'Основная информация',
    shortTitle: 'Главное',
    description:
      'Напишите название и описание достижения, а также загрузите для него иконку.',
  },
  {
    title: 'Взаимосвязь для получения достижения',
    shortTitle: 'Взаимосвязь',

    description:
      'Выберите, что должен сделать пользователь для получения достижения, и как много. Например, получить 20 лайков на своих рецептах.',
  },
  {
    title: 'Заключение',
    shortTitle: 'Заключение',
    description: 'Выберите, что вы хотите сделать с достижением.',
  },
];
export interface Step {
  title: string;
  shortTitle: string;
  description: string;
}

@Component({
  selector: 'app-new-achievement',
  templateUrl: './new-achievement.component.html',
  animations: [trigger('modal', modal())],
  styleUrls: [
    '../../../../../styles/forms.scss',
    './new-achievement.component.scss',
  ],
})
export class NewAchievementComponent implements OnInit {
  steps = steps;
  errorModal = false;
  successModal = false;
  errorModalContent = '';
  awaitModal = false;
  showInfo = false;
  saveModal = false;
  currentStep = 0;
  achievementDescriptions = achievementDescriptions;
  kinds = Object.keys(achievementDescriptions);
  descriptionsArray = Object.values(achievementDescriptions);

  selectedKind: string = this.kinds[0];
  currentUserId: number = 0;
  achievementImage: string = '/assets/images/add-category.png';
  defaultImage: string = '/assets/images/add-category.png';
  @Output() editEmitter = new EventEmitter<boolean>();
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;
  protected destroyed$: Subject<void> = new Subject<void>();

    ingredientsArVariants = ['ингредиент', 'ингредиента', 'ингредиентов'];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private userService:UserService,
    private notifyService: NotificationService,
    private achievementService: AchievementService,
  ) {
    this.form = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(30),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(200),
        ],
      ],
      image: [null,[notNullValidator()]],
      color:['#ff3867'],
      kind: ['', [Validators.required]],
      points: [0, [Validators.required, Validators.min(1)]],
      step: [1],
    });
    this.beginningData = this.form.getRawValue();
  }
  ngOnInit(): void {
    addModalStyle(this.renderer)
    this.currentUserInit();
  }

  unsetImage() {
    this.form.get('image')?.setValue(null);
    this.achievementImage = this.defaultImage;
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pictureFile: File | undefined = input.files?.[0];

    if (pictureFile && checkFile(pictureFile, true)) {
      this.form.get('image')?.setValue(pictureFile);
      const objectURL = URL.createObjectURL(pictureFile);
      this.achievementImage = objectURL;
    }
  }

  protected colors: string[] = palette;
  protected selectedColorIndex: number = 13;
  protected colorSource: 'palette' | 'custom' = 'palette';

  protected selectColor(index: number): void {
    this.selectedColorIndex = index;
    this.colorSource = 'palette';
  }
  protected selectCustomColor(): void {
    this.colorSource = 'custom';
  }

  get color() {
    const color = this.colors[this.selectedColorIndex];
    return this.colorSource === 'custom' ? this.form.value.color : color
  }

  postAchievement() {
    this.awaitModal = true;
    const content = this.form.value;
    const kind = this.getKeyByValue(content.kind);
    const newAchievement: IAchievement = {
      color: this.color,
      id: 0,
      iconUrl: '',
      title: content.title,
      description: content.description,
      kind: kind!,
      points: content.points,
    };
    this.achievementService
      .postAchievement(newAchievement)
      .pipe(
        catchError(() => {
          this.errorModal = true;
          return EMPTY;
        }),
        finalize(() => {
          this.awaitModal = false;
          this.cd.markForCheck();
        }),

        switchMap((response: any) => {
          const file: File = this.form.value.image;

          const insertedId = response.id; // Сохраняем вставленный ID
          // Если есть файл, загружаем изображение
          if (file) {
            return this.achievementService.uploadIcon(file).pipe(
              switchMap((uploadResponse: any) => {
                const filename = uploadResponse.filename;
                // Устанавливаем изображение для категории
                return this.achievementService
                  .setIconToAchievement(insertedId, filename)
                  .pipe(
                    catchError(() => {
                      this.throwErrorModal(
                        'Произошла ошибка при попытке связать загруженное изображение и достижение',
                      );
                      return EMPTY;
                    }),
                  );
              }),
            );
          } else {
            // Если файла нет, возвращаем пустой поток
            return of(null);
          }
        }),
        tap(() => {
          this.successModal = true; // Устанавливаем флаг успешного выполнения операций
          this.cd.markForCheck();
        }),
      )
      .subscribe();
  }

  setKind(kind: string) {
    this.form.get('kind')?.setValue(kind);
  }

  closeEditModal() {
    this.areObjectsEqual()
      ? (this.closeModal = true)
      : this.closeEmitter.emit(true);
  }

  beginningData: any;

  closeModal = false;
  @Output() closeEmitter = new EventEmitter<boolean>();

  clickBackgroundNotContent(elem: Event) {
    if (elem.target !== elem.currentTarget) return;
    this.closeEditModal();
  }

  getKeyByValue(value: string): string | undefined {
    const entries = Object.entries(achievementDescriptions);
    for (const [key, description] of entries) {
      if (description === value) {
        return key;
      }
    }
    return undefined; // Возвращаем undefined, если значение не найдено
  }

  areObjectsEqual(): boolean {
    return (
      JSON.stringify(this.beginningData) !==
      JSON.stringify(this.form.getRawValue())
    );
  }

  goToPreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.scrollTop();
    }
  }
  notValid() {
    return this.validNextSteps();
  }
  clickOnCircleStep(i: number) {
    if (this.validNextSteps() === 0 || this.validNextSteps() > i) {
      this.currentStep = i;
      this.scrollTop();
    }
  }
  noValidStepDescription(step: number): string {
    switch (step) {
      case 0:
        return 'Название, описание и иконка обязательны';
      case 1:
        return 'Достижение должно иметь взаимосвязь и количество повторений больше нуля';
    }
    return '';
  }

  buttonDisabled() {
    return (
      this.currentStep === this.validNextSteps() - 1 ||
      this.currentStep === steps.length - 1
    );
  }

  private throwErrorModal(content: string) {
    this.errorModalContent = content;
    this.errorModal = true;
  }

  handleErrorModal() {
    this.errorModal = false;
    addModalStyle(this.renderer);
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.postAchievement();
    }
    this.saveModal = false;
    addModalStyle(this.renderer);
  }

  handleCloseModal(answer: boolean) {
    this.closeModal = false;

    if (answer) {
      this.closeEmitter.emit(true);
    } else {
      addModalStyle(this.renderer);
    }
  }

  handleSuccessModal() {
    this.closeEmitter.emit(true);
    this.editEmitter.emit();
    this.successModal = false;

    if (
      this.userService.getPermission(
        this.currentUser.limitations || [],
        Permission.AchievementCreated,
      )
    ) {
      const notify: INotification = this.notifyService.buildNotification(
        'Достижение успешно создано',
        `Вы успешно создали достижение «${this.form.value.title}»`,
        'success',
        'star',
        '',
      );
      this.notifyService
        .sendNotification(notify, this.currentUserId, true)
        .subscribe();
    }

    
  }

  private currentUserInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: IUser) => {
        this.currentUserId = data.id;
                  this.currentUser = data;

      });
    
      
  }
  currentUser: IUser = { ...nullUser };

  validNextSteps(): number {
    for (let s = 0; s <= 1; s++) {
      switch (s) {
        case 0:
          if (
            !this.form.get('title')!.valid ||
            !this.form.get('description')!.valid||
            !this.form.get('image')!.valid
          ) {
            return 1;
          }
          break;
        case 1:
          if (
            !this.form.get('kind')!.valid ||
            !this.form.get('points')!.valid
          ) {
            return 2;
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
      this.scrollTop();
    }
  }
}
