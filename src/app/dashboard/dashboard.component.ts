import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { products } from '../../stripe-config';

interface UserSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">CareSlot Dashboard</h1>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-gray-700">{{ userEmail }}</span>
              <button
                (click)="signOut()"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Current Subscription Status -->
          <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Current Plan</h3>
              
              <div *ngIf="loadingSubscription" class="flex items-center">
                <svg class="animate-spin h-5 w-5 text-orange-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading subscription...
              </div>

              <div *ngIf="!loadingSubscription && subscription">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-500">Plan</p>
                    <p class="text-lg font-semibold text-gray-900">{{ getProductName(subscription.price_id) }}</p>
                  </div>
                  <div>
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-green-100 text-green-800': subscription.subscription_status === 'active',
                        'bg-yellow-100 text-yellow-800': subscription.subscription_status === 'trialing',
                        'bg-red-100 text-red-800': subscription.subscription_status === 'canceled' || subscription.subscription_status === 'past_due',
                        'bg-gray-100 text-gray-800': subscription.subscription_status === 'not_started'
                      }"
                    >
                      {{ subscription.subscription_status | titlecase }}
                    </span>
                  </div>
                </div>
                
                <div *ngIf="subscription.current_period_end" class="mt-4">
                  <p class="text-sm text-gray-500">
                    {{ subscription.cancel_at_period_end ? 'Expires' : 'Renews' }} on 
                    {{ subscription.current_period_end * 1000 | date:'mediumDate' }}
                  </p>
                </div>
              </div>

              <div *ngIf="!loadingSubscription && !subscription">
                <p class="text-gray-500">No active subscription</p>
              </div>
            </div>
          </div>

          <!-- Available Products -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Available Services</h3>
              
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div 
                  *ngFor="let product of products" 
                  class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                >
                  <div class="flex-1 min-w-0">
                    <div class="focus:outline-none">
                      <span class="absolute inset-0" aria-hidden="true"></span>
                      <p class="text-sm font-medium text-gray-900">{{ product.name }}</p>
                      <p class="text-sm text-gray-500 truncate">{{ product.description }}</p>
                    </div>
                  </div>
                  <div class="flex-shrink-0">
                    <button
                      (click)="checkout(product.priceId, product.mode)"
                      [disabled]="checkoutLoading"
                      class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span *ngIf="checkoutLoading" class="mr-2">
                        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      {{ product.mode === 'subscription' ? 'Subscribe' : 'Purchase' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Order History -->
          <div class="bg-white overflow-hidden shadow rounded-lg mt-6">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Order History</h3>
              
              <div *ngIf="loadingOrders" class="flex items-center">
                <svg class="animate-spin h-5 w-5 text-orange-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading orders...
              </div>

              <div *ngIf="!loadingOrders && orders.length === 0" class="text-gray-500">
                No orders found
              </div>

              <div *ngIf="!loadingOrders && orders.length > 0" class="space-y-3">
                <div 
                  *ngFor="let order of orders"
                  class="border border-gray-200 rounded-lg p-4"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-sm font-medium text-gray-900">Order #{{ order.order_id }}</p>
                      <p class="text-sm text-gray-500">{{ order.order_date | date:'medium' }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">
                        ${{ (order.amount_total / 100).toFixed(2) }}
                      </p>
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-green-100 text-green-800': order.order_status === 'completed',
                          'bg-yellow-100 text-yellow-800': order.order_status === 'pending',
                          'bg-red-100 text-red-800': order.order_status === 'canceled'
                        }"
                      >
                        {{ order.order_status | titlecase }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  standalone: false
})
export class DashboardComponent implements OnInit {
  authForm: FormGroup;
  products = products;
  userEmail = '';
  subscription: UserSubscription | null = null;
  orders: any[] = [];
  checkoutLoading = false;
  loadingSubscription = true;
  loadingOrders = true;
  private supabase: SupabaseClient;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );

    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async ngOnInit() {
    await this.checkAuth();
    await this.loadSubscription();
    await this.loadOrders();
  }

  async checkAuth() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }
    this.userEmail = user.email || '';
  }

  async loadSubscription() {
    try {
      const { data, error } = await this.supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading subscription:', error);
        return;
      }

      this.subscription = data;
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      this.loadingSubscription = false;
    }
  }

  async loadOrders() {
    try {
      const { data, error } = await this.supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      this.orders = data || [];
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      this.loadingOrders = false;
    }
  }

  getProductName(priceId: string | null): string {
    if (!priceId) return 'Unknown';
    const product = products.find(p => p.priceId === priceId);
    return product ? product.name : 'Unknown';
  }

  async checkout(priceId: string, mode: 'payment' | 'subscription') {
    this.checkoutLoading = true;

    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`${environment.supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/dashboard`,
          mode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Checkout failed: ${error.message}`);
    } finally {
      this.checkoutLoading = false;
    }
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth']);
  }
}