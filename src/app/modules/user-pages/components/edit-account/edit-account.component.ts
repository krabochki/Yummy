import {
  AfterContentChecked,
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
})
export class EditAccountComponent implements OnInit, AfterContentChecked {
  @Input() editableUser: IUser = nullUser;

  newUser: IUser = nullUser;
  @Output() updatedUser = new EventEmitter<IUser>();
  @Output() closeEmitter = new EventEmitter<boolean>();

  saveModal: boolean = false;
  closeModal: boolean = false;
  successModal: boolean = false;

  pinterestMask = pinterestMask;
  facebookMask = facebookMask;
  siteMask = anySiteMask;
  vkMask = vkMask;
  twitterMask = twitterMask;

  pinterestLink = '';
  facebookLink = '';
  twitterLink = '';
  vkLink = '';

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
  ) {
    const pinterestProfile = this.newUser.socialNetworks.find(
      (network) => network.name === 'pinterest',
    );
    if (pinterestProfile) this.pinterestLink = pinterestProfile.link;
    const facebookProfile = this.newUser.socialNetworks.find(
      (network) => network.name === 'facebook',
    );
    if (facebookProfile) this.facebookLink = facebookProfile.link;
    const twitterProfile = this.newUser.socialNetworks.find(
      (network) => network.name === 'twitter',
    );
    if (twitterProfile) this.twitterLink = twitterProfile.link;
    const vkProfile = this.newUser.socialNetworks.find(
      (network) => network.name === 'ВКонтакте',
    );
    if (vkProfile) this.vkLink = vkProfile.link;
  }

  ngOnInit() {
    this.userService.getUsers().subscribe((data: IUser[]) => {
      this.users = data;
    });
    this.myImage = this.defaultImage;
    this.newUser = { ...this.editableUser };
  }
  checkData(): boolean {
    const pinterestProfile = this.newUser.socialNetworks.find(
      (network) => network.name === 'pinterest',
    );
    if (pinterestProfile) this.pinterestLink = pinterestProfile.link;
    const facebookProfile = this.newUser.socialNetworks.find(
      (network) => network.name === 'facebook',
    );
    if (facebookProfile) this.facebookLink = facebookProfile.link;
    const twitterProfile = this.newUser.socialNetworks.find(
      (network) => network.name === 'twitter',
    );
    if (twitterProfile) this.twitterLink = twitterProfile.link;
    const vkProfile = this.newUser.socialNetworks.find(
      (network) => network.name === 'ВКонтакте',
    );
    if (vkProfile) this.vkLink = vkProfile.link;
    if (
      !this.siteMask.test(this.newUser.personalWebsite) &&
      this.newUser.personalWebsite !== ''
    )
      return false;

    if (this.vkLink !== '' && !vkMask.test(this.vkLink)) return false;

    if (this.facebookLink !== '' && !facebookMask.test(this.vkLink))
      return false;
    if (this.pinterestLink !== '' && !pinterestMask.test(this.pinterestLink))
      return false;
    if (this.twitterLink !== '' && !twitterMask.test(this.twitterLink))
      return false;
    if (!usernameMask.test(this.newUser.username)) {
      return false;
    }
    if (this.areObjectsEqual(this.newUser, this.editableUser)) {
      return false;
    }
    if (this.ifUsernameExists()) {
      console.log('пользователь существует')
      return false;
    }

    return true;
  }

  users: IUser[] = [];

  ifUsernameExists():boolean {
    const usernameExists = this.users.find(
      (u) => u.username === this.newUser.username,
    );

    if (usernameExists === undefined) {
      console.log('все норм');
      return false;
    }

    return true;
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
  myImage: string = '';
  defaultImage: string = '../../../../../assets/images/add-userpic.png';

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

  usernameMask = usernameMask;

  getFacebook(value: string) {
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.name.toLowerCase() !== 'facebook',
    );
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.link !== '',
    );
    if (value !== '') {
      const facebook: SocialNetwork = { link: value, name: 'facebook' };
      this.newUser.socialNetworks.push(facebook);
    }
  }
  getPinterest(value: string) {
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.name.toLowerCase() !== 'pinterest',
    );
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.link !== '',
    );
    if (value !== '') {
      const pinterest: SocialNetwork = { link: value, name: 'pinterest' };
      this.newUser.socialNetworks.push(pinterest);
    }
  }
  getVk(value: string) {
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.name !== 'ВКонтакте',
    );
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.link !== '',
    );
    if (value !== '') {
      const vk: SocialNetwork = { link: value, name: 'ВКонтакте' };
      this.newUser.socialNetworks.push(vk);
    }
  }
  getTwitter(value: string) {
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.name.toLowerCase() !== 'twitter',
    );
    this.newUser.socialNetworks = this.newUser.socialNetworks.filter(
      (network) => network.link !== '',
    );
    if (value !== '') {
      const twitter: SocialNetwork = { link: value, name: 'twitter' };
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
