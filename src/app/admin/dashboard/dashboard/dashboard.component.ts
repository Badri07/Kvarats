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
//  userName: string = 'Sarah';
  currentDate: Date = new Date();

  IsshowPagination:boolean = false;
  tableHeight:string = '300px';

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
    debugger
    this.userName = this._authService.getUsername();
    console.log();
    
  }
users = [
  {
    doctor: {
      name: 'Dr. John Smith',
      specialization: 'Neurosurgeon',
      avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
    },
    patient: {
      name: 'Jesus Adams',
      phone: '+1 41254 45214',
    },
    dateTime: '28 May 2025 - 11:15 AM',
    mode: 'Online',
    status: 'Confirmed',
  },
  {
    doctor: {
      name: 'Dr. Lisa White',
      specialization: 'Oncologist',
      avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    },
    patient: {
      name: 'Ezra Belcher',
      phone: '+1 65895 41247',
    },
    dateTime: '29 May 2025 - 11:30 AM',
    mode: 'In-Person',
    status: 'Cancelled',
  },
  {
    doctor: {
      name: 'Dr. Patricia Brown',
      specialization: 'Pulmonologist',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    patient: {
      name: 'Glen Lentz',
      phone: '+1 62458 45845',
    },
    dateTime: '30 May 2025 - 09:30 AM',
    mode: 'Online',
    status: 'Confirmed',
  },
  {
    doctor: {
      name: 'Dr. Rachel Green',
      specialization: 'Urologist',
      avatar: 'https://randomuser.me/api/portraits/women/25.jpg',
    },
    patient: {
      name: 'Bernard Griffith',
      phone: '+1 61422 45214',
    },
    dateTime: '30 May 2025 - 10:00 AM',
    mode: 'Online',
    status: 'Checked Out',
  },
  {
    doctor: {
      name: 'Dr. Michael Smith',
      specialization: 'Cardiologist',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    patient: {
      name: 'John Elsass',
      phone: '+1 47851 26371',
    },
    dateTime: '30 May 2025 - 11:00 AM',
    mode: 'Online',
    status: 'Schedule',
  }
];


columnDefs: any = [
  {
    headerCheckboxSelection: true,
    checkboxSelection: true,
    field: 'checkbox',
    width: 40,
    pinned: 'left',
    cellClass: 'no-focus-style'
  },
  {
    headerName: 'Doctor',
    field: 'doctor.name',
    flex: 1.5,
    cellRenderer: (params: any) => {
      const doctor = params.data.doctor;
      return `
        <div class="flex items-center gap-2">
          <img src="${doctor.avatar}" class="rounded-full w-8 h-8" />
          <div>
            <div class="">${doctor.name}</div>
            <div class="text-xs text-gray-500">${doctor.specialization}</div>
          </div>
        </div>
      `;
    },
  },
  {
    headerName: 'Patient',
    field: 'patient.name',
    flex: 1.2,
    cellRenderer: (params: any) => {
      const patient = params.data.patient;
      return `
        <div>
          <div class="">${patient.name}</div>
          <div class="text-xs text-gray-500">${patient.phone}</div>
        </div>
      `;
    },
  },
  {
    headerName: 'Date & Time',
    field: 'dateTime',
    flex: 1,
  },
  {
    headerName: 'Mode',
    field: 'mode',
    flex: 0.8,
  },
  {
  headerName: 'Status',
  field: 'status',
  flex: 1,
  cellRenderer: (params: any) => {
    const status = params.value;

    const statusStyles: Record<string, string> = {
      'Confirmed': 'text-green-700 border-green-600 bg-green-100',
      'Cancelled': 'text-red-700 border-red-600 bg-red-100',
      'Checked Out': 'text-cyan-700 border-cyan-600 bg-cyan-100',
      'Schedule': 'text-blue-700 border-blue-600 bg-blue-100',
    };

    const styles = statusStyles[status] || 'text-gray-700 border-gray-500 bg-gray-100';

    return `
      <span class="px-3 py-1 rounded-md text-sm font-medium border ${styles}">
        ${status}
      </span>
    `;
  },
}

,
  {
    headerName: 'Actions',
    field: 'actions',
    flex: 0.8,
    pinned: 'right',
    cellRenderer: () => {
      return `
        <div class="flex gap-2">
          <button class="text-orange-600 hover:underline" data-action="edit">
            <i class="fa fa-edit"></i>
          </button>
          <button class="text-orange-600 hover:underline" data-action="delete">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
    },
  }
];




  editUser(id:string){

  }
  
  onDelete(id:string){

  }



}
