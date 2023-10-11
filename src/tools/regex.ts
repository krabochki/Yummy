export const loginMask = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/; //маска для почты
export const passMask = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/; //маска для пароля
export const usernameMask = /^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]{4,20}$/;
export const emailOrUsernameMask =
  /^([\w-\\.]+@([\w-]+\.)+[\w-]{2,4})|((?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]{4,20})$/;
