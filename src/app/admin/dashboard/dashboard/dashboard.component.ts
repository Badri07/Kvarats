import { Component, inject } from '@angular/core';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  LineController,
  PointElement,
  ChartType,
  ChartConfiguration,
  LineElement,
  Filler
} from 'chart.js';
import { AuthService } from '../../../service/auth/auth.service';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

ChartJS.register(
  CategoryScale,
  LineController,
  LinearScale,
  LineElement,
  PointElement,
  Filler ,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {


  public _authService = inject(AuthService);
  public breadcrumbService = inject(BreadcrumbService);
  userName!:string | null;
  get_email!:string | null;
    summaryCards = [
        {
          title: 'Total Patients',
          value: '1,500',
          icon: '/icons/Group 28.png'
        },
        {
          title: 'Total Staff',
          value: '1,400',
          icon: '/icons/image.png'
        },
        {
          title: 'Total Therapists',
          value: '100',
          icon: '/icons/image (1).png'
        },
        {
          title: 'Appointments This Week',
          value: '1,100',
          icon: 'icons/image (2).png'
        }
      ];

  therapists = [
    {
      name: 'Dr. Badri Kvarats',
      specialty: 'Dentist'
    },
    {
      name: 'Dr. Badri Kvarats',
      specialty: 'Dentist'
    },
    {
      name: 'Dr. Badri Kvarats',
      specialty: 'Dentist'
    }
  ];

  recoveryRates = [
    {
      condition: 'Cold',
      percentage: 80
    },
    {
      condition: 'Fracture',
      percentage: 80
    },
    {
      condition: 'Ache',
      percentage: 80
    },
    {
      condition: 'Cold',
      percentage: 80
    }
  ];

  pieData = [
    { name: 'Male', value: 30 },
    { name: 'Female', value: 30 },
    { name: 'Child', value: 20 },
    { name: 'Senior Citizen', value: 20 }
  ];

  ngOnInit(){
    
    this.getUserName();
      this.breadcrumbService.setVisible(false);

  //   this.breadcrumbService.setBreadcrumbs([
  //   { label: 'dashboard', url: 'dashboard' },
  // ]);

  }
ngDestroy(){
    this.breadcrumbService.setVisible(true);

}
 getLineChartConfig(color: string, bgColor: string, label: string): ChartConfiguration<'line'> {
    return {
      type: 'line',
      data: {
        labels: ['11-07-2025', '12-07-2025', '13-07-2025', '14-07-2025', '15-07-2025', '16-07-2025', '17-07-2025','Extra'],
        datasets: [{
          label,
           data: [10, 20, 15, 25, 30, 18,10] ,
          fill: true,
          borderColor: color,
          backgroundColor: bgColor,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: color
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${label}: ${ctx.parsed.y}`
            }
          }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        elements: {
          line: { borderWidth: 2 },
        }
      }
    };
  }

  chartConfigs = [
    this.getLineChartConfig('#8b5cf6', 'rgba(139, 92, 246, 0.1)', 'Appointments'),
    this.getLineChartConfig('#f97316', 'rgba(249, 115, 22, 0.1)', 'Operations'),
    this.getLineChartConfig('#22c55e', 'rgba(34, 197, 94, 0.1)', 'New Patients'),
    this.getLineChartConfig('#3b82f6', 'rgba(59, 130, 246, 0.1)', 'Earning')
  ];



  getUserName(){
    
    this.userName = this._authService.getUsername();
    console.log();
    
  }

}
