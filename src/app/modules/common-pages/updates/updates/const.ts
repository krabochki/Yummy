export interface IUpdate {
  id: number;
  shortName: string;
  fullName: string;
  whoCanView: string;
  link: string;
  showAuthor: boolean;
  description: string;
  author: number;
  date: string;
  state: string;
  tags: string[];
  status: 'awaits' | 'public';
  context: 'managers' | 'all';
}
export const nullUpdate: IUpdate = {
  id: 0,
  showAuthor: true,
  shortName: '',
  fullName: '',
  link: '',
  whoCanView: '',
  description: '',
  author: 0,
  date: '',
  tags: [],
  status: 'public',
  state: '',
  context: 'all',
};



