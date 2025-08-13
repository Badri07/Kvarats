import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: false
})
export class AuthComponent implements OnInit {
  authForm: FormGroup;
  isSignUp = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
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

  ngOnInit() {
    this.checkUser();
  }

  async checkUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      this.router.navigate(['/dashboard']);
    }
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.authForm.value;

    try {
      if (this.isSignUp) {
        const { error } = await this.supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) throw error;

        this.successMessage = 'Account created successfully! You can now sign in.';
        this.isSignUp = false;
        this.authForm.reset();
      } else {
        const { error } = await this.supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred';
    } finally {
      this.loading = false;
    }
  }
}