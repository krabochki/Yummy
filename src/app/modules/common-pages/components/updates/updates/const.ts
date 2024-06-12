import {  role } from "src/app/modules/user-pages/models/users";

export interface IUpdate {
  id: number;
  shortName: string;
  fullName: string;
  link: string;
  description: string;
  open: boolean;
  authorId: number;
  authorName?: string;
  sendDate: string;
  authorRole?: role;
  state: string;
  tags: string[];
  notify: 'all' | 'managers' | 'nobody';
  status: 'awaits' | 'public';
  newState?: string;
  context: 'managers' | 'all';
}
export const nullUpdate: IUpdate = {
  id: 0,
  notify: 'nobody',
  shortName: '',
  open: false,
  fullName: '',
  link: '',
  description: '',
  authorId: 0,
  sendDate: '',
  tags: [],
  status: 'public',
  state: '',
  context: 'all',
};



