export function useToast() { return { toast: (msg: string) => alert(msg) }; }

export const toast = (msg: string) => alert(msg);