export interface Product {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const products: Product[] = [
  {
    priceId: 'price_1RvaEHPs06Tfvw8M5fzQQtZs',
    name: 'Appointment',
    description: 'Teleconsultation',
    mode: 'payment'
  }
];