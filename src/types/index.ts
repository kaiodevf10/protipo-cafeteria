export interface Choice { id: string; label: string; price: number }
export interface OptionGroup { id: string; name: string; required?: boolean; multiple?: boolean; choices: Choice[] }
export interface Product { id: string; name: string; category: string; description: string; price: number; image: string; available: boolean; featured?: boolean; options?: OptionGroup[] }
export interface CartItem { key: string; productId: string; selections: Record<string, string[]>; notes: string; quantity: number; productSnapshot?: Product }
