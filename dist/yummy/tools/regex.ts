export const loginMask = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/; //маска для почты
export const passMask = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{8,20}$/; //маска для пароля
export const usernameMask = /^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]{4,20}$/;
export const emailOrUsernameMask =
  /^([\w-\\.]+@([\w-]+\.)+[\w-]{2,4})|((?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]{4,20})$/;

export const pinterestMask = /^https?:\/\/(www\.)?pinterest\.com\/[\w-]+\/?$/;
export const facebookMask = /^https?:\/\/(www\.)?facebook\.com\/[\w-]+\/?$/;
export const vkMask = /^https?:\/\/(www\.)?vk\.com\/[\w-]+\/?$/;
export const telegramMask = /^https?:\/\/(www\.)?t\.me\/[\w-]+\/?$/;
export const twitterMask = /^https?:\/\/(www\.)?twitter\.com\/[\w-]+\/?$/;
export const anySiteMask =
  /^https?:\/\/([\da-z.-]+)\.([a-z.]{2,6})[\/\w.-]*\/?$/;

export const allPunctuationMarks = /[\s,.;:!]+/;
export const brackets = /[(){}[\]<>]/g;

export const numbers =
  /^(?!0+$)([1-9]\d*(\.\d+)?|[1-9]\d*(,\d+)?|0(\.\d+|,\d+)?)?$/;
