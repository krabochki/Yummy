import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { usernameMask } from 'src/tools/regex';
import { IUser, nullUser, SocialNetwork } from '../../models/users';
import { trigger } from '@angular/animations';
import { modal } from 'src/tools/animations';
import {
  vkMask,
  facebookMask,
  twitterMask,
  pinterestMask,
  anySiteMask,
} from 'src/tools/regex';
import { UserService } from '../../services/user.service';
import { FormArray } from '@angular/forms';

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss'],
  animations: [trigger('modal', modal())],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class EditAccountComponent implements OnInit, AfterContentChecked {
  @Input() editableUser: IUser = { ...nullUser };
  @Output() updatedUser = new EventEmitter<IUser>();
  @Output() closeEmitter = new EventEmitter<boolean>();

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;
  newUser: IUser = { ...nullUser };

  pinterestMask = pinterestMask;
  facebookMask = facebookMask;
  siteMask = anySiteMask;
  vkMask = vkMask;
  twitterMask = twitterMask;
  usernameMask = usernameMask;

  pinterestLink = '';
  facebookLink = '';
  twitterLink = '';
  vkLink = '';

  myImage: string = '';
  defaultImage: string = '../../../../../assets/images/add-userpic.png';

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
  ) {
    for (const network of this.newUser.socialNetworks) {
      switch (network.name) {
        case 'pinterest':
          this.pinterestLink = network.link;
          break;
        case 'facebook':
          this.facebookLink = network.link;
          break;
        case 'twitter':
          this.twitterLink = network.link;
          break;
        case 'ВКонтакте':
          this.vkLink = network.link;
          break;
      }
    }
  }

  ngOnInit() {
    this.userService.users$.subscribe((data: IUser[]) => {
      this.users = data;
    });
    this.myImage = this.defaultImage;
    this.newUser = { ...this.editableUser };
  }

  checkData(): boolean {
    for (const network of this.newUser.socialNetworks) {
      switch (network.name) {
        case 'pinterest':
          if (network.link) this.pinterestLink = network.link;
          break;
        case 'facebook':
          if (network.link) this.facebookLink = network.link;
          break;
        case 'twitter':
          if (network.link) this.twitterLink = network.link;
          break;
        case 'ВКонтакте':
          if (network.link) this.vkLink = network.link;
          break;
      }
    }

    if (
      !this.siteMask.test(this.newUser.personalWebsite) &&
      this.newUser.personalWebsite !== ''
    ) {
      return false;
    }

    if (this.vkLink !== '' && !vkMask.test(this.vkLink)) {
      return false;
    }

    if (this.facebookLink !== '' && !facebookMask.test(this.vkLink)) {
      return false;
    }

    if (this.pinterestLink !== '' && !pinterestMask.test(this.pinterestLink)) {
      return false;
    }

    if (this.twitterLink !== '' && !twitterMask.test(this.twitterLink)) {
      return false;
    }

    if (!usernameMask.test(this.newUser.username)) {
      return false;
    }
    if (this.areObjectsEqual(this.newUser, this.editableUser)) {
      return false;
    }
    if (this.ifUsernameExists()) {
      return false;
    }

    return true;
  }

  users: IUser[] = [];

  ifUsernameExists(): boolean {
    if (this.newUser.username !== this.editableUser.username) {
      const usernameExists = this.users.find(
        (u) => u.username === this.newUser.username,
      );

      if (usernameExists === undefined) {
        return false;
      }

      return true;
    } else return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChangeInput(event: any) {
    const selectedFile = event.target.files[0]; // Первый выбранный файл

    if (selectedFile) {
      const objectURL = URL.createObjectURL(selectedFile);
      this.myImage = '';
      this.myImage = objectURL;

      // const formData = new FormData();
      // formData.append('userpic', file, file.name);
      // this.http.post(this.url, formData).subscribe((response) => {
      //   });
    }
  }

  //проверяем равны ли все поля в обьектах
  areObjectsEqual(obj1: any, obj2: any): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Проверка на количество полей
    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  }

  updateUser() {
    this.updatedUser.emit(this.newUser);
  }

  handleSaveModal(answer: boolean) {
    if (answer) {
      this.updateUser();
      this.successModal = true;
    }
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
    this.closeModal = false;
  }

  getSocialMedia(
    nameValue: 'facebook' | 'twitter' | 'ВКонтакте' | 'pinterest',
    linkValue: string,
  ) {
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.name.toLowerCase() !== nameValue,
    );
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.link !== '',
    );
    if (linkValue !== '') {
      const twitter: SocialNetwork = { name: nameValue, link: linkValue };
      this.newUser.socialNetworks.push(twitter);
    }
  }

  getFullname(value: string) {
    this.newUser.fullName = value;
  }
  getDescription(value: string) {
    this.newUser.description = value;
  }
  getUsername(value: string) {
    this.newUser.username = value;
  }
  getWebsite(value: string) {
    this.newUser.personalWebsite = value;
  }
  getLocation(value: string) {
    this.newUser.location = value;
  }
  getQuote(value: string) {
    this.newUser.quote = value;
  }
}
