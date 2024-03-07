import { Injectable } from '@angular/core';
import { IGroup, nullGroup } from '../models/ingredients';
import { BehaviorSubject } from 'rxjs';

import { IIngredient } from '../models/ingredients';
import { IRecipe } from '../models/recipes';
import { HttpClient } from '@angular/common/http';
import { groupsSource } from 'src/tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  groupsUrl = groupsSource;
  groupsSubject = new BehaviorSubject<IGroup[]>([]);
  groups$ = this.groupsSubject.asObservable();

  constructor(private http: HttpClient) {}

  updateGroup(updatedGroup: IGroup) {
    return this.http.put(`${this.groupsUrl}/${updatedGroup.id}`, updatedGroup);
  }

  setImageToGroup(groupId:number, image:string) {
    return this.http.put(`${this.groupsUrl}/set-image/${groupId}`, {
      image: image,
    });
  }

  uploadGroupImage(file: File) {
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post(`${this.groupsUrl}/image`, formData);
  }
  getGroupForEditing(groupId: number) {
    return this.http.get<IGroup>(`${this.groupsUrl}/for-editing/${groupId}`);
  }
  getGroupsBySearch(searchText: string) {
    const url = `${this.groupsUrl}/search/?search=${searchText}`;
    return this.http.get<IGroup[]>(url);
  }

  getGroupsAndIngredientsBySearch(searchText: string) {
    const url = `${this.groupsUrl}/global/search/?search=${searchText}`;
    return this.http.get<IGroup[]>(url);
  }

  getGroupIngredientsBySearch(searchText: string, groupId: number) {
    const url = `${this.groupsUrl}/search-by-group/${groupId}?search=${searchText}`;
    return this.http.get<IIngredient[]>(url);
  }

  deleteGroup(groupId: number) {
    return this.http.delete(`${this.groupsUrl}/${groupId}`);
  }

  deleteImage(filename: string) {
    const url = `${this.groupsUrl}/files/${filename}`;
    return this.http.delete(url);
  }

  loadGroupData() {
    return this.http
      .get<IGroup[]>(this.groupsUrl)
      .subscribe((receivedGroups: IGroup[]) => {
        receivedGroups.forEach((group) => {
          this.getGroupIngredients(group.id).subscribe(
            (receivedCategoriesIds: number[]) => {
              group.ingredients = receivedCategoriesIds || [];

              if (group.image) {
                this.downloadImage(group.image).subscribe({
                  next: (blob) => {
                    group.imageURL = URL.createObjectURL(blob);
                  },
                  error: () => {
                    group.imageURL = '';
                  },
                });
              }
            },
          );
        });

        this.setGroups(receivedGroups);
      });
  }

  downloadImage(filename: string) {
    const fileUrl = `${this.groupsUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  getSomeGroups(limit: number, page: number) {
    const url = `${this.groupsUrl}/some?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  getSomeFullGroups(limit: number, page: number, userId: number) {
    const url = `${this.groupsUrl}/some-full/${userId}?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  getSomeIngredientsOfGroup(
    limit: number,
    page: number,
    groupId: number,
    userId: number,
  ) {
    const url = `${this.groupsUrl}/some-ingredients/${groupId}/${userId}?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  setGroups(groups: IGroup[]) {
    this.groupsSubject.next(groups);
  }

  public getGroupIngredients(groupId: number) {
    const url = `${this.groupsUrl}/ingredients/${groupId}`;
    return this.http.get<number[]>(url);
  }

  public getGroup(groupId: number) {
    const url = `${this.groupsUrl}/group/${groupId}`;
    return this.http.get<IGroup>(url);
  }

  getGroupsWithCategories(
    groups: IGroup[],
    categories: IIngredient[],
  ): IGroup[] {
    const groupWithCategories: IGroup[] = [];
    groups.forEach((group) => {
      const categoriesOfGroup: IIngredient[] = [];
      group.ingredients.forEach((element) => {
        const findCategory = categories.find(
          (elem) => elem.id === element && elem.status === 'public',
        );
        if (findCategory) {
          categoriesOfGroup.push(findCategory);
        }
      });
      if (categoriesOfGroup.length > 0) {
        groupWithCategories.push(group);
      }
    });
    return groupWithCategories;
  }

  postGroup(newGroup: IGroup) {
    const url = `${this.groupsUrl}`;
    return this.http.post(url, newGroup);
  }

  getNotEmptyGroups(groups: IGroup[]): IGroup[] {
    return (groups = groups.filter((group) => group.ingredients.length > 0));
  }

  getNumberRecipesOfGroup(
    group: IGroup,
    recipes: IRecipe[],
    categories: IIngredient[],
  ): number {
    let groupRecipesIds: number[] = [];
    group.ingredients.forEach((ingredientId) => {
      const currentCategory = categories.find(
        (ingredient) => (ingredient.id = ingredientId),
      );
      if (currentCategory) {
        const ingredientRecipesIds: number[] = [];
        recipes.forEach((recipe) => {
          if (recipe.categories.includes(currentCategory.id))
            ingredientRecipesIds.push(recipe.id);
        });
        groupRecipesIds = [...groupRecipesIds, ...ingredientRecipesIds];
      }
    });
    groupRecipesIds = groupRecipesIds.filter((recipeId, index, self) => {
      return self.indexOf(recipeId) === index;
    });
    return groupRecipesIds.length;
  }

  getGroupOfCategory(groups: IGroup[], ingredient: IIngredient): IGroup {
    return (
      groups.find((group) => group.ingredients.includes(ingredient.id)) ||
      nullGroup
    );
  }

  updateGroupInGroups(group: IGroup) {
    const currentGroups = this.groupsSubject.value;
    const index = currentGroups.findIndex((r) => r.id === group.id);
    if (index !== -1) {
      const updatedGroups = [...currentGroups];
      updatedGroups[index] = group;

      this.groupsSubject.next(updatedGroups);
    }
  }

  addGroupToGroups(group: IGroup) {
    const currentGroups = this.groupsSubject.value;
    const updatedGroups = [...currentGroups, group];
    this.groupsSubject.next(updatedGroups);
  }
  deleteGroupFromGroups(group: IGroup) {
    this.groupsSubject.next(
      this.groupsSubject.value.filter(
        (categories) => categories.id !== group.id,
      ),
    );
  }
}
