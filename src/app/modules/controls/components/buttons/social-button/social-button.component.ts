import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-social-button',
  templateUrl: './social-button.component.html',
  styleUrls: ['./social-button.component.scss'],
})
export class SocialButtonComponent {
  @Input() showIcon: boolean = true;
  @Input() showText: boolean = false;
  @Input() social: 'copy'|'twitter'|'pinterest'|'vk'|'youtube'|'facebook' = 'copy';
  @Input() url: string = ''
  
  
}
