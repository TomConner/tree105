export interface Pickup {
  code: string;
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_created: string;
  numtrees: number;
  extra: number;
  comment: string;
  order_created: string;
  method: string;
  intent_created: string;
}

