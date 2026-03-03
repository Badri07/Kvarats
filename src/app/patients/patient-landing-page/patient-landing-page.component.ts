import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-landing-page',
  standalone: false,
  templateUrl: './patient-landing-page.component.html',
  styleUrl: './patient-landing-page.component.scss'
})
export class PatientLandingPageComponent {

   logo:string ='/images/LogoLatest.png';
 stats = [
    { value: '10K+', label: 'Appointments Booked' },
    { value: '500+', label: 'Verified Therapists' },
    { value: '24/7', label: 'Health Support' }
  ];

  features = [
    {
      icon: 'calendar-plus',
      title: 'Easy Appointment Booking',
      description: 'Book appointments with therapists in just a few clicks. View real-time availability and get instant confirmation.',
      color: 'from-[#fb923c] to-[#ff9034]'
    },
    {
      icon: 'search-location',
      title: 'Find Nearby Therapists',
      description: 'Discover qualified therapists in your area. See their specialties, availability, and patient reviews.',
      color: 'from-[#4F46E5] to-[#7C73FF]'
    },
    {
      icon: 'file-medical',
      title: 'Save Health Notes',
      description: 'Keep private notes and save your initial assessments. Your health journey documented securely.',
      color: 'from-[#10B981] to-[#34D399]'
    },
    {
      icon: 'heartbeat',
      title: 'Track Your Vitals',
      description: 'Monitor your health metrics daily. Add and track blood pressure, heart rate, and other vital signs.',
      color: 'from-[#F59E0B] to-[#FBBF24]'
    },
    {
      icon: 'credit-card',
      title: 'Secure Online Payments',
      description: 'Pay for appointments securely with multiple payment options. Get instant receipts.',
      color: 'from-[#8B5CF6] to-[#A78BFA]'
    },
    {
      icon: 'file-pdf',
      title: 'Download Health Reports',
      description: 'Download your health reports, appointment summaries, and payment receipts as PDF files.',
      color: 'from-[#EF4444] to-[#F87171]'
    }
  ];

  vitals = [
    { icon: 'tachometer-alt', value: '120/80', label: 'Blood Pressure', status: 'Normal', color: 'red' },
    { icon: 'heartbeat', value: '72', label: 'Heart Rate', status: 'Optimal', color: 'pink' },
    { icon: 'thermometer-half', value: '98.6°F', label: 'Temperature', status: 'Normal', color: 'blue' },
    { icon: 'lungs', value: '98%', label: 'Oxygen Level', status: 'Excellent', color: 'green' }
  ];

  testimonials = [
    {
      initials: 'SJ',
      name: 'Sarah Johnson',
      duration: 'Patient since 2024',
      text: 'Finding therapists in my area was so easy. The booking process is seamless and I love being able to track my health vitals.',
      rating: 5
    },
    {
      initials: 'RD',
      name: 'Robert Davis',
      duration: 'Patient since 2023',
      text: 'The ability to save notes and download PDF reports has been invaluable for keeping track of my health journey.',
      rating: 4.5
    },
    {
      initials: 'ME',
      name: 'Maria Evans',
      duration: 'Patient since 2024',
      text: 'Secure payments and easy appointment scheduling make managing my healthcare appointments stress-free.',
      rating: 5
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.initializeAnimations();
  }

  initializeAnimations(): void {
    // This would initialize any animations when component loads
    console.log('Landing page loaded');
  }

  navigateToSignUp(): void {
    this.router.navigate(['/patient/registration']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getRatingStars(rating: number): any[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push('full');
      } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }
}
