import { isDevMode } from '@angular/core';
const devSource = 'http://localhost:3000/backend';
const prodSource = 'https://www.yuummy.site/backend';
const source = isDevMode() ? devSource : prodSource ;

export const ingredientsSource = source + '/ingredients';
export const groupsSource = source + '/groups';
export const reportsSource = source + '/reports';
export const matchSource = source + '/match';
export const recipesSource = source + '/recipes';
export const achievementsSource = source + '/achievements';
export const commentsSource = source + '/comments';
export const updatesSource = source + '/updates';
export const apiSource = source + '/api';
export const plansSource = source + '/plans';
export const categoriesSource = source + '/categories';
export const sectionsSource = source + '/sections';
export const notificationsSource = source + '/notifications';
export const usersSource = source + '/users';
