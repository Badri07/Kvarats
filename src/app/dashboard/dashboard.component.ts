import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
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