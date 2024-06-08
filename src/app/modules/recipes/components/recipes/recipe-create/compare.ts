import { Observable, concatMap, from, of, reduce } from "rxjs";
import { ICategory } from "../../../models/categories";
import { RecipeService } from "../../../services/recipe.service";
import { Ingredient, Instruction } from "../../../models/recipes";



export function compareCategories(rc:RecipeService,after:ICategory[],before: number[], recipeId:number) {
    const changed = JSON.stringify(before) !== JSON.stringify(after);

    const insert$: Observable<any>[] = [];
    let delete$: Observable<any> = of(null);

    if (changed) {
        delete$ = rc.deleteAllCategories(recipeId);
        if (after.length > 0) {
        after.forEach((category) => {
          insert$.push(
            rc.setCategoryToRecipe(
              category.id, recipeId
            ),
          );
        });
      }
    }
    return { delete: delete$, insert: insert$.length?insert$:of(null) };
  }

  
  
export function compareInstructions(
  rc: RecipeService,
  newInstructions: Instruction[],
  oldInstructions: Instruction[],
  recipeId: number) {
  const delete$: Observable<any>[] = [];
  const insert$: Observable<any>[] = [];
    
  const newFiles = newInstructions.map((instruction) =>
    instruction.images.map((image: any) => image?.file?.name || ''),
  );

  const oldFiles = oldInstructions.map((instruction) =>
    instruction.images.map((image: any) => image?.file?.name ||''),
  );

  if (
    JSON.stringify(newInstructions) !== JSON.stringify(oldInstructions) ||
    JSON.stringify(newFiles) !== JSON.stringify(oldFiles)
  ) {
    delete$.push(rc.deleteInstructionsImages(recipeId));
    delete$.push(rc.deleteAllInstructions(recipeId));

    newInstructions.forEach((instruction) => {
      insert$.push(postInstruction(rc, recipeId, instruction));
    });
  }
  return {
    delete:  delete$ ,
    insert:  insert$,
  };
}

export function postInstruction(
  rc: RecipeService,
  recipeId: number,
  instruction: Instruction,
) {
  return rc.postInstruction(recipeId, instruction.name).pipe(
    concatMap((response: any) => {
      const instructionId = response.id;
      return from(instruction.images).pipe(
        concatMap((image: any) => {
          if (image.file) {
            return rc.uploadInstructionImage(image.file).pipe(
              concatMap((res: any) => {
                const filename = res.filename;
                return rc.postInstructionImage(instructionId, filename);
              }),
            );
          } else {
            return of(null);
          }
        }),
        // Если нужно собрать результаты в массив
        reduce((acc: any[], value: any) => {
          if (value !== null) {
            acc.push(value);
          }
          return acc;
        }, []),
      );
    }),
  );
}
  

 
export function compareIngredients(rc:RecipeService,before:Ingredient[],after:Ingredient[],recipeId:number) {
    const variationsChanged = JSON.stringify(before) !== JSON.stringify(after);

    const insert$: Observable<any>[] = [];
    let delete$: Observable<any> = of(null);

    if (variationsChanged) {
        delete$ = rc.deleteAllIngredients(recipeId);
        if (after.length > 0) {
        after.forEach((ingredient) => {
          insert$.push(
            rc.postIngredientToRecipe(
              recipeId,
              ingredient.quantity,
              ingredient.name,
              ingredient.unit,
            ),
          );
        });
      }
    }
    return { delete: delete$, insert: insert$.length?insert$:of(null) };
  }
