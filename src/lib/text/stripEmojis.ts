export const stripEmojis = (text: string) => text.replace(/\p{Extended_Pictographic}/gu, '').trim();

