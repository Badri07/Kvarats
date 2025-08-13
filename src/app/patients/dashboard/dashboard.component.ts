import { Component, inject } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {


  public authService = inject(AuthService);

    currentDate: Date = new Date();

  
  ngOnInit(){
    this.getUserDetails();
  }


  heartRateChart = {
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      data: [140, 150, 130, 160, 145],
      borderColor: '#ffffff',
      backgroundColor: 'transparent',
      tension: 0.4,
      pointBackgroundColor: '#ffffff'
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
};

feverChart = {
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      data: [98.1, 98.5, 99, 98.3, 98.7],
      borderColor: '#FFA157',
      backgroundColor: 'transparent',
      tension: 0.4,
      pointBackgroundColor: '#FFA157'
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
};

ecgChart = {
  type: 'bar',
  data: {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      label: 'ECG Peak (bpm)',
      data: [120, 115, 130, 110, 118, 125, 122], 
      backgroundColor: [
        '#FFA157', '#FFB36B', '#FFD07A',
        '#FFA157', '#FFB36B', '#FFD07A', '#FFA157'
      ],
      borderRadius: 6, 
      barThickness: 20
    }]
  },
  options: {
    responsive: true,
    plugins: { 
      legend: { display: false }
    },
    scales: { 
      x: { grid: { display: false } },
      y: { grid: { display: false }, ticks: { stepSize: 10 } }
    }
  }
};

userName!:string;
email!:string;
getUserDetails(){
  debugger
  this.userName = this.authService.getPatientUsername();
  this.email = this.authService.getPatientEmail();
}
}
