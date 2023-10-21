import { RecipeCreatingComponent } from '../components/recipes/recipe-creating/recipe-creating.component';

export const RecipeCreateClosingGuard = (component: RecipeCreatingComponent) => {
  
    const isEdited: boolean = component.isFormEdited() 
    if (isEdited)
    return confirm('На странице есть несохраненные изменения. Вы хотите покинуть ее?');
    else return true
  
};
