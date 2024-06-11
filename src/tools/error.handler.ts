interface ErrorHeader {
  [key: number]: string;
}

interface ErrorDescription {
  [key: number]: string;
}

export function getErrorHeader(statusCode: number): string {
  const errorHeaders: ErrorHeader = {
    0: 'Сервер не отвечает',
    400: 'Ошибка запроса',
    401: 'Ошибка аутентификации',
    403: 'Доступ запрещен',
    404: 'Ресурс не найден',
    500: 'Внутренняя ошибка сервера',
    503: 'Сервис недоступен',
    504: 'Время ожидания истекло',
  };

  return errorHeaders[statusCode] || 'Неизвестная ошибка';
}


export function getErrorDescription(statusCode: number): string {
  const errorDescriptions: ErrorDescription = {
    0: 'Пожалуйста, проверьте подключение к интернету или обратитесь к администратору системы.',
    400: 'Запрос содержит некорректные данные или параметры.',
    401: 'Пользователь не авторизован для доступа к запрашиваемому ресурсу.',
    403: 'У вас нет прав для доступа к данному ресурсу.',
    404: 'Запрашиваемый ресурс не существует на сервере.',
    500: 'Возникла ошибка при обработке запроса на сервере.',
    503: 'В данный момент сервис временно недоступен из-за технических работ или перегрузки сервера.',
    504: 'Сервер не успел получить ответ от другого сервера за отведенное время.',
  };

  return (
    errorDescriptions[statusCode] ||
    'Неизвестная ошибка. Обратитесь к администратору для получения помощи.'
  );
}

export function checkFile(file: File, onlySvg?:boolean) {
  if (file) {
    let allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg']; // Разрешенные расширения файлов
    if (onlySvg) {
      allowedExtensions = ['.svg']
    }
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf('.')); // Получаем расширение файла
    if (allowedExtensions.includes(extension)) {
      return true;
    }
  }
  return false;
}