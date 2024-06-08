 export function getModalDescription(type: 'success' | 'save' | 'exit',editMode:boolean): string {
    if (editMode) {
      switch (type) {
        case 'success':
          return 'Рецепт в «Календаре рецептов» успешно изменен!';
        case 'save':
          return 'Вы уверены, что хотите изменить рецепт в плане?';
        default:
          return 'Вы уверены, что не хотите изменять рецепт в плане?';
      }
    } else {
      switch (type) {
        case 'success':
          return 'Рецепт успешно добавлен в «Календарь рецептов»!';
        case 'save':
          return 'Вы уверены, что хотите добавить рецепт в план?';
        default:
          return 'Вы уверены, что не хотите добавить рецепт в план?';
      }
    }
  }

 export function getModalTitle( editMode:boolean, type: 'success' | 'save' | 'exit'): string {
    if (editMode) {
      switch (type) {
        case 'success':
          return 'Рецепт изменен';
        case 'save':
          return 'Подтвердите изменение';
      }
    } else {
      switch (type) {
        case 'success':
          return 'Рецепт добавлен';
        case 'save':
          return 'Подтвердите добавление';
      }
    }
    return 'Подтвердите выход';
  }
