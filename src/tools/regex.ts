export const loginMask = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/; //маска для почты
export const passMask = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/; //маска для пароля
export const usernameMask = /^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]{4,20}$/;
export const emailOrUsernameMask =
  /^([\w-\\.]+@([\w-]+\.)+[\w-]{2,4})|((?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]{4,20})$/;

export const pinterestMask = /^(https?:\/\/)?(www\.)?pinterest\.com\/.+/;
export const facebookMask = /^(https?:\/\/)?(www\.)?facebook\.com\/.+/;
export const vkMask = /^(https?:\/\/)?(www\.)?vk\.com\/.+/;
export const twitterMask = /^(https?:\/\/)?(www\.)?twitter\.com\/.+/;
export const anySiteMask =
  /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
