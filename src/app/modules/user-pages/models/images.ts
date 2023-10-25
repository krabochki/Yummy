export interface IImage {
  id: number; 
  context: 'userpic' | 'category' | 'recipe' | 'instriction' | 'section'
    contextRelatedId: number;
    file: FormData
}
export const nullImage: IImage = {
    id: 0,
    context: 'userpic',
    contextRelatedId: 0,
    file: new FormData()
}
