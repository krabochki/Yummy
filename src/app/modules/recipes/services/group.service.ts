import { Injectable } from '@angular/core';
import { IGroup } from '../models/ingredients';
import { IIngredient } from '../models/ingredients';
import { HttpClient } from '@angular/common/http';
import { groupsSource } from 'src/tools/sourses';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  groupsUrl = groupsSource;

  constructor(private http: HttpClient) {}

  updateGroup(updatedGroup: IGroup) {
    const options = { withCredentials: true };
    return this.http.put(`${this.groupsUrl}/update/${updatedGroup.id}`, updatedGroup, options);
  }

  setImageToGroup(groupId: number, image: string) {
    const options = { withCredentials: true };
    return this.http.put(`${this.groupsUrl}/set-image/${groupId}`, {
      image: image,
    }, options);
  }

  uploadGroupImage(file: File) {
    const options = { withCredentials: true };
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post(`${this.groupsUrl}/files/image`, formData, options);
  }
  getGroupForEditing(groupId: number) {
    const options = { withCredentials: true };
    return this.http.get<IGroup>(`${this.groupsUrl}/for-editing/${groupId}`, options);
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
        const options = { withCredentials: true };

    return this.http.delete(`${this.groupsUrl}/${groupId}`, options);
  }

  deleteImage(groupId: number) {
    const options = { withCredentials: true };
    const url = `${this.groupsUrl}/files/${groupId}`;
    return this.http.delete(url, options);
  }

  
  downloadImage(filename: string) {
    const fileUrl = `${this.groupsUrl}/files/${filename}`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }

  getSomeGroups(limit: number, page: number) {
    const url = `${this.groupsUrl}/some?limit=${limit}&page=${page}`;
    return this.http.get(url);
  }

  getSomeFullGroups(limit: number, page: number) {
        const options = { withCredentials: true };

    const url = `${this.groupsUrl}/some-full?limit=${limit}&page=${page}`;
    return this.http.get(url, options);
  }

  getSomeIngredientsOfGroup(
    limit: number,
    page: number,
    groupId: number,
  ) {
            const options = { withCredentials: true };

    const url = `${this.groupsUrl}/some-ingredients/${groupId}?limit=${limit}&page=${page}`;
    return this.http.get(url, options);
  }


  public getGroup(groupId: number){
                const options = { withCredentials: true };

    const url = `${this.groupsUrl}/group/${groupId}`;
    return this.http.get<any>(url, options);
  }

  public getShortGroup(groupId: number) {
    const url = `${this.groupsUrl}/short/${groupId}`;
    return this.http.get<IGroup>(url);
  }


  postGroup(newGroup: IGroup) {
    const options = { withCredentials: true };
    const url = `${this.groupsUrl}/insert`;
    return this.http.post(url, newGroup, options);
  }
  

}
