import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../service/admin/admin.service';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UploadedFile } from '../../../models/useradmin-model';
@Component({
  selector: 'app-assessment-versions',
  standalone: false,
  templateUrl: './assessment-versions.component.html',
  styleUrl: './assessment-versions.component.scss'
})
export class AssessmentVersionsComponent implements OnInit {


  public selectedTab: 'assessment' | 'previous' | 'Patientfiles' ='assessment';

  patientDetails: any = [];
  isLoading = true;
  activeTab: string = 'assessment';
  uploadedFiles: UploadedFile[]=[];
  assessmentList: any[] = [];
isshowassesment:boolean = true;
  assessmentData: any = {
  id: null,                         
  patientId: '',                   
  version: 0,

  // Vitals
  systolic: null,
  diastolic: null,
  heartRate: null,
  pulse: null,
  respiratoryRate: null,
  temperature: null,
  bloodSugar: null,
  spO2: null,
  weight: null,
  height: null,
  bmi: null,

  createdAt: null,

  // Medical History
  allergies: [] as string[],
  medications: [] as string[],
  chronicConditions: [] as string[],

  surgicalHistory: [] as { procedure: string; date: string; hospital: string }[],
  familyHistoryConditions: [] as string[],
  chiefComplaints: [] as { complaint: string; painScale: number; notes: string }[],

  socialHabits: [] as {
    smokingStatusId?: number | null;
    cigarettesPerDay?: number | null;
    alcoholStatusId?: number | null;
    alcoholFrequency?: string | null;
    beverageStatusId?: number | null;
    cupsPerDay?: number | null;
    drugUsageStatusId?: number | null;
    drugDetails?: string | null;
  }[]
};


getAllVersionsList:any[]=[]
isshowpdf:boolean = false
// isshowiframe:boolean = false;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private toastr: ToastrService,
      private sanitizer: DomSanitizer

  ) {}

  public assessmentId!:any;
  patientId!:any
  ngOnInit(): void {


    // const uploadedFileUrl = "https://careslot-dev.s3.us-east-1.amazonaws.com/patientassessment/20e41f2a-c9b7-4a4b-9f7a-29f73d17fabc_Patient-Assessment-2025-07-17%20%282%29.pdf?AWSAccessKeyId=AKIAXJSU3GUHEWQQLXVC&Expires=2068809256&Signature=jPdAtZQmwyIzBzjM7tUh0mSXVno%3D";


    this.patientId = this.route.snapshot.paramMap.get('patientId');
    this.assessmentId = this.route.snapshot.paramMap.get('assessmentId');
    console.log('Patient ID from route param:patientIdpatientIdpatientId', this.patientId);

    if (this.patientId) {
      this.fetchPatientDetails(this.patientId);
      setTimeout(() => {
        this.fetchPatientAssessment();
      }, 500);
    } else {
      this.toastr.error('Invalid Patient ID', 'Error');
    }


    this.getAllVersion();
    this.getAssesmentFiles()

  }

  assesmentId!:string

  fetchPatientDetails(patientId: string): void {
  this.isLoading = true;
  this.adminService.getPatientById(patientId).subscribe({
    next: (response: any) => {
      this.patientDetails = response.data;
      this.assesmentId = response.data.assessmentId;
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Failed to fetch patient details', err);
      this.toastr.error('Failed to load patient details.', 'Error');
      this.isLoading = false;
    }
  });
}


iframeUrl: SafeResourceUrl | null = null;
  iframeUrlPrevious: SafeResourceUrl | null = null;

fetchPatientAssessment(): void {
  debugger
  this.adminService.getPatientAssessment(this.assesmentId).subscribe({
    next: (data) => {
      console.log(data);
      
      if (data.uploadedFileUrl) {
        this.isshowassesment = false;
        const cleanUrl = `${data.uploadedFileUrl}#zoom=100&toolbar=1&navpanes=0`;
        this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(cleanUrl);
      } else {
        // flatten details into assessmentData
        this.assessmentData = {
          ...data,
          ...data.details
        };
        this.isshowassesment = true;
      }
    },
    error: (err) => {
      // console.error('Failed to fetch patient assessment', err);
      // this.toastr.error('Failed to load patient assessment.', 'Error');
    }
  });
}

decodeFileName(encoded: string): string {
  return decodeURIComponent(encoded);
}


getAssesmentFiles() {
  this.adminService.getAssesmentFiles(this.patientId).subscribe({
    next: (data) => {
      console.log("Full response", data);
      this.uploadedFiles = data;
    },
    error: (error) => {
      console.error("Error fetching assessment files:", error);
    }
  });
}


onSelectFile(assessmentId: any) {
  debugger
  this.adminService.getAssesmentFilesById(assessmentId).subscribe(res => {
   console.log("response",res);
   if(res.uploadedFileUrl){
    const cleanUrl = `${res.uploadedFileUrl}#zoom=75&toolbar=1&navpanes=0`;
      // this.iframeUrlPrevious = this.sanitizer.bypassSecurityTrustResourceUrl(cleanUrl);
     this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(cleanUrl);
   }
  });

}


rowData: any[] = [
  {
    avatar: 'https://i.pravatar.cc/150?img=1',
    minIncome: 10000,
    maxIncome: 19999,
    discountPercentage: 5,
  },
  {
    avatar: 'https://i.pravatar.cc/150?img=2',
    minIncome: 20000,
    maxIncome: 29999,
    discountPercentage: 10,
  },
  {
    avatar: 'https://i.pravatar.cc/150?img=3',
    minIncome: 30000,
    maxIncome: 39999,
    discountPercentage: 15,
  },
  {
    avatar: 'https://i.pravatar.cc/150?img=4',
    minIncome: 40000,
    maxIncome: 49999,
    discountPercentage: 20,
  },
  {
    avatar: 'https://i.pravatar.cc/150?img=5',
    minIncome: 50000,
    maxIncome: 59999,
    discountPercentage: 25,
  }
];


getAllVersion(): void {
  const patientId = this.route.snapshot.paramMap.get('patientId');
  console.log('Patient ID from route param:', patientId);

  if (patientId) {
    this.adminService.getAllVersions(patientId).subscribe((res) => {
      console.log('res', res);
      this.rowData = res.map((item: any, index: number) => ({
        ...item,
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));

      this.getAllVersionsList = this.rowData;
      console.log("getAllVersionsListgetAllVersionsListgetAllVersionsList",this.getAllVersionsList);
      
    });
  } else {
    console.error('No patient ID found in route.');
  }
}

assessmentDataList:any=[];
showModal:boolean = false;

onAssessmentClick(assessmentId: string): void {
  console.log('Clicked Assessment ID:', assessmentId);

  this.adminService.getPatientAssessment(assessmentId).subscribe({
    next: (data) => {
      if (!data) {
        this.toastr.warning('No records found for this assessment.');
        this.iframeUrlPrevious = null;
        this.isshowpdf = false;
        return;
      }

      this.assessmentDataList = data;
      console.log("onAssessmentClickonAssessmentClickonAssessmentClick", data);

      if (data.uploadedFileUrl) {
        const cleanUrl = `${data.uploadedFileUrl}#zoom=100&toolbar=1&navpanes=0`;
        this.iframeUrlPrevious = this.sanitizer.bypassSecurityTrustResourceUrl(cleanUrl);
        this.isshowpdf = false;
        this.showModal = true;
      } else {
        this.isshowpdf = true;
      }
    },
    error: (err) => {
       const errorMessage = err.error?.message;
       this.toastr.error(errorMessage);  
    }
  });
}


closePdfModal() {
  this.isshowpdf = false;
}
closeModal() {
  this.showModal = false;
  this.iframeUrlPrevious = null;
}


      image:string ='/images/LogoLatest.png';

downloadPDF(): void {
  const element = document.getElementById('pdf-content');
  if (!element) {
    console.error('PDF content element not found');
    return;
  }
 
  const opt = {
    margin:       0.5,
    filename: `Patient-Assessment-${this.assessmentData.patientCode}-${new Date().toISOString().slice(0, 10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
 
  html2pdf().set(opt).from(element).save();
}

//   // Create a clone of the content to modify for PDF
//   const element = document.getElementById('pdf-content');
//   const clone = element.cloneNode(true) as HTMLElement;
  
//   // Apply PDF-specific styles to the clone
//   clone.style.width = '210mm';
//   clone.style.padding = '15mm';
//   clone.style.margin = '0';
//   clone.style.boxSizing = 'border-box';
//   clone.style.fontSize = '12pt';
  
//   // Hide elements that shouldn't be in PDF
//   const buttons = clone.querySelectorAll('button');
//   buttons.forEach(btn => btn.style.display = 'none');
  
//   // Temporary add to body
//   clone.style.position = 'absolute';
//   clone.style.left = '-9999px';
//   document.body.appendChild(clone);

//   const opt = {
//     margin: 0,
//     filename: `Patient-Assessment-${this.assessmentData.patientCode}-${new Date().toISOString().slice(0, 10)}.pdf`,
//     image: { type: 'jpeg', quality: 0.98 },
//     html2canvas: { 
//       scale: 0.75, // Reduced scale for better fit
//       width: 210 * 3.78, // 210mm in pixels (3.78px/mm)
//       windowWidth: 210 * 3.78,
//       useCORS: true,
//       letterRendering: true,
//       scrollX: 0,
//       scrollY: 0
//     },
//     jsPDF: { 
//       unit: 'mm', 
//       format: 'a4', 
//       orientation: 'portrait',
//       hotfixes: ["px_scaling"] 
//     },
//     pagebreak: { mode: 'avoid-all', before: '.page-break' }
//   };

//   // Generate PDF
//   html2pdf()
//     .set(opt)
//     .from(clone)
//     .save()
//     .finally(() => {
//       // Clean up
//       document.body.removeChild(clone);
//     });
// }

// tab
setTab(tab: 'assessment' | 'previous' | 'Patientfiles') {
  debugger
  this.selectedTab = tab;

  const slider = document.querySelector('.slider') as HTMLElement;
  const tabElements = document.querySelectorAll('.tab');

  const tabIndex = { 'assessment': 0, 'previous': 1 , 'Patientfiles':2}[tab];

  if (slider && tabElements[tabIndex]) {
    const tabEl = tabElements[tabIndex] as HTMLElement;
    slider.style.left = `${tabEl.offsetLeft}px`;
    slider.style.width = `${tabEl.offsetWidth}px`;
  }
  // if (tab === 'Listclient') {
  //   this.loadClientList();
  // }
}

}
