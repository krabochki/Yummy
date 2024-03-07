import { EMPTY, Observable, catchError, concatMap, forkJoin, of, tap } from "rxjs";
import { ICategory } from "../../../models/categories";
import { RecipeService } from "../../../services/recipe.service";
import { Ingredient, Instruction } from "../../../models/recipes";
import { IIngredient } from "../../../models/ingredients";

export function compareCategories(rs:RecipeService,currentCategories:ICategory[],before: number[], recipeId:number) {
    const after: number[] = currentCategories.map((category) => category.id);
    const added = after.filter((num) => !before.includes(num));
    const removed = before.filter((num) => !after.includes(num));
    const subscribes: Observable<any>[] = [];

    added.forEach((addedId) => {
      subscribes.push(rs.setCategoryToRecipe(addedId, recipeId));
    });
    removed.forEach((removedId) => {
      subscribes.push(rs.unsetCategoryToRecipe(removedId, recipeId));
    });
    return subscribes;
}
  
export function compareInstructions(
  rc: RecipeService,
  newInstructions: Instruction[],
  oldInstructions: Instruction[],
  recipeId:number) {
  const subscribes: Observable<any>[] = [];
  if (JSON.stringify(newInstructions) !== JSON.stringify(oldInstructions)) {
    oldInstructions.forEach((instruction) => {
      subscribes.push(deleteInstruction(rc,instruction.id).deleteImages$);
      subscribes.push(
        deleteInstruction(rc,instruction.id).deleteInstruction$,
      );
    });

    newInstructions.forEach((instruction) => {
      subscribes.push(postInstruction(rc, recipeId, instruction));
    });
      console.log(newInstructions)
      console.log(oldInstructions)
  }
  return subscribes;
}

 export function postInstruction(rc:RecipeService, recipeId: number, instruction: Instruction) {
    return rc.postInstruction(recipeId, instruction.name).pipe(
      concatMap((response: any) => {
        const instructionId = response.id;
        console.log('Инструкция успешно загружена!');
        console.log('Картинок в инструкции - ' + instruction.images.length);

        // После создания инструкции выполнение запросов на загрузку изображений
        const imageUploadObservables = instruction.images.map((image: any) => {
          if (image.file) {
            return rc.uploadInstructionImage(image.file).pipe(
              concatMap((res: any) => {
                console.log('Картинка загружена в хранилище');

                const filename = res.filename;
                // После загрузки изображения выполнение запроса на привязку его к инструкции
                return rc
                  .postInstructionImage(instructionId, filename)
                  .pipe(
                    catchError((error) => {
                      console.log(error);
                      return EMPTY;
                    }),
                    tap(() => {
                      console.log('Картинка и инструкция успешно связаны');
                    }),
                  );
              }),
            );
          } else {
            return of(null); // Если изображение отсутствует, просто возвращаем null
          }
        });

        // С помощью forkJoin мы ждем завершения всех запросов на загрузку изображений
        return forkJoin(imageUploadObservables).pipe();
      }),
    );
}
  

  export function deleteInstruction(rc:RecipeService,instructionId: number) {
    const deleteImages$ = rc
      .getInstructionImages(instructionId)
      .pipe(
        concatMap((filenames) => {
          const deleteImages$ = filenames.map((filename) =>
            rc.deleteImage(filename),
          );
          return forkJoin(deleteImages$).pipe();
        }),
      );

    const deleteInstruction$ =
      rc.deleteInstruction(instructionId);

    return { deleteImages$, deleteInstruction$ };
}
  


export function compareIngredients(rc:RecipeService,before:Ingredient[],after:Ingredient[],recipeId:number) {
    const variationsChanged = JSON.stringify(before) !== JSON.stringify(after);

    const insert$: Observable<any>[] = [];
    let delete$: Observable<any> = of(null);

    if (variationsChanged) {
      if (before.length > 0) {
        delete$ = rc.deleteAllIngredients(recipeId);
      }
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
    return { delete: delete$, insert: insert$ };
  }
