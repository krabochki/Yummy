import { trigger, transition, style, animate } from '@angular/animations';
import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  animations: [
    trigger('select', [
       transition(':enter', [
         style({ height: '0' }),
         animate('800ms ease-out', style({ height: '*' }))
       ]),
       transition(':leave', [
          style({ height: '*' }),
         animate('800ms ease-in', style({ height: '0' }))
       ])
     ])
    
  ],
})
export class SelectComponent {

  @Input() items:string[]=[];
  @Input() disabling:boolean[]=[];
  @Input() routerLinks:string[]=[];

  isLoggedIn:boolean=false;
  constructor(private authService:AuthService){

  }
  ngOnInit(){
    this.isLoggedIn=  this.authService.isLoggedIn;
  }
  open:boolean = false;

  shiftedItems?: string[];

  bodyHeight: Number | undefined = 0;
  ngAfterViewInit(){
    this.shiftedItems = [...this.items]; 
    this.shiftedItems.shift()


  }

  



  
}
