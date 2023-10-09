import { Component, Input } from '@angular/core';
import { IRecipe } from 'src/app/models/recipes';


@Component({
  selector: 'app-recipe-list-item',
  templateUrl: './recipe-list-item.component.html',
  styleUrls: ['./recipe-list-item.component.scss']
})
export class RecipeListItemComponent {

   @Input() recipe?:IRecipe | undefined  ;

   likes?: Number = 0;
   cooks?: Number = 0;

   ngOnInit(){
    this.likes = this.recipe?.likesId.length
    this.cooks = this.recipe?.cooksId.length
   }

   

   

}
