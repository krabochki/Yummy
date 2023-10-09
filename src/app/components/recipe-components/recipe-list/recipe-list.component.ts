import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { IRecipe } from 'src/app/models/recipes';
import { Subscription } from 'rxjs';
import { RecipeService } from 'src/app/services/recipe.service';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss']
})
export class RecipeListComponent {
  @Input() recipes?:IRecipe[]  ;




  constructor(
  ) {

  }

  

 
 
}
