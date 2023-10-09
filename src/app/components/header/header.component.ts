import { Component, HostListener } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

  recipeSelectItems:string[]=['Рецепты', 'Ваши рецепты', 'Все рецепты', 'Все категории', 'Закладки','Подбор рецептов']
  cooksSelectItems:string[]=['Кулинары', 'Ваш профиль', 'Все кулинары', 'Обновления']
  
  mobile:boolean= false;
  hambOpen:boolean= false;

  ngOnInit(){

    if( screen.width <= 480){

      this.mobile=true;
     }
     else{
      this.mobile=false;
     }
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event:any) {
   if( event.target.innerWidth <= 480){

    this.mobile=true;
   }
   else{
    this.mobile=false;
   }

  }

constructor( public authService:AuthService
  ){

  }
}
