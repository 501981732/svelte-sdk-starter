export const validataPhone = n => /^[1][3,4,5,6,7,8,9][0-9]{9}$/.test(n);

export const inBrowser = typeof window !== 'undefined';

export const UA = inBrowser && window.navigator.userAgent.toLowerCase();

export const isInAPP = UA && /wuba/.test(UA);

export const isWeiXin = UA && /micromessenger/.test(UA);
