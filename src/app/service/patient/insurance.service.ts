import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Insurance, 
  InsuranceVerification, 
  InsuranceClaim, 
  Superbill, 
  EligibilityCheck,
  CPTCode,
  ICD10Code,
  InsuranceProvider,
  ClaimStats,
  ERA,
  ERAProcessingResult,
  EOB,
  EOBSearch,
  ERASearch,
  PrimaryInsurancePayload
} from '../../models/insurance-model';
import { environment } from '../../../environments/environments';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InsuranceService {

  public http = inject(HttpClient);
  private insurances = signal<Insurance[]>([
    {
      id: '1',
      clientId: 'client-lotus',
      patientId: 'patient-1',
      isPrimary: true,
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BCBS123456789',
      groupNumber: 'GRP001',
      subscriberId: 'SUB123456',
      subscriberName: 'John Smith',
      subscriberDateOfBirth: new Date(1985, 5, 15),
      relationshipToSubscriber: 'self',
      effectiveDate: new Date(2024, 0, 1),
      expirationDate: new Date(2024, 11, 31),
      copay: 25,
      deductible: 1000,
      coinsurance: 20,
      outOfPocketMax: 5000,
      planType: 'ppo',
      networkStatus: 'in-network',
      authorizationRequired: false,
      referralRequired: false,
      mentalHealthCoverage: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      clientId: 'client-apollo',
      patientId: 'patient-2',
      isPrimary: true,
      provider: 'Aetna',
      policyNumber: 'AET987654321',
      subscriberId: 'SUB987654',
      subscriberName: 'Sarah Johnson',
      subscriberDateOfBirth: new Date(1990, 8, 22),
      relationshipToSubscriber: 'self',
      effectiveDate: new Date(2024, 0, 1),
      copay: 30,
      deductible: 1500,
      planType: 'hmo',
      networkStatus: 'in-network',
      authorizationRequired: true,
      referralRequired: true,
      mentalHealthCoverage: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  private claims = signal<InsuranceClaim[]>([
    {
      id: 'claim-1',
      insuranceId: '1',
      patientId: 'patient-1',
      providerId: 'provider-1',
      serviceDate: new Date(2025, 0, 15),
      submissionDate: new Date(2025, 0, 16),
      claimNumber: 'CLM-2025-001',
      totalAmount: 150.00,
      allowedAmount: 120.00,
      paidAmount: 96.00,
      adjustmentAmount: 30.00,
      patientResponsibility: 24.00,
      status: 'paid',
      services: [
        {
          id: 'svc-1',
          cptCode: '90834',
          description: 'Psychotherapy, 45 minutes',
          serviceDate: new Date(2025, 0, 15),
          units: 1,
          chargedAmount: 150.00,
          allowedAmount: 120.00,
          paidAmount: 96.00,
          adjustmentAmount: 30.00,
          placeOfService: '11',
          diagnosis: ['F41.1']
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  private superbills = signal<Superbill[]>([
    {
      id: 'sb-1',
      patientId: 'patient-1',
      providerId: 'provider-1',
      serviceDate: new Date(2025, 0, 15),
      createdDate: new Date(2025, 0, 15),
      status: 'finalized',
      patientInfo: {
        name: 'John Smith',
        dateOfBirth: new Date(1985, 5, 15),
        address: '123 Main St, Anytown, ST 12345',
        phone: '(555) 123-4567',
        insuranceInfo: {
          provider: 'Blue Cross Blue Shield',
          policyNumber: 'BCBS123456789',
          subscriberId: 'SUB123456'
        }
      },
      providerInfo: {
        name: 'Dr. Sarah Johnson',
        npi: '1234567890',
        taxId: '12-3456789',
        address: '456 Medical Plaza, Anytown, ST 12345',
        phone: '(555) 987-6543',
        licenseNumber: 'LIC123456'
      },
      services: [
        {
          id: 'svc-1',
          cptCode: '90834',
          description: 'Psychotherapy, 45 minutes',
          units: 1,
          rate: 150.00,
          amount: 150.00
        }
      ],
      diagnosis: [
        {
          code: 'F41.1',
          description: 'Generalized anxiety disorder',
          isPrimary: true
        }
      ],
      totalAmount: 150.00,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  private eligibilityChecks = signal<EligibilityCheck[]>([]);

  private cptCodes = signal<CPTCode[]>([
    { code: '90791', description: 'Psychiatric diagnostic evaluation', category: 'evaluation', duration: 60, isActive: true, rate: 200 },
    { code: '90834', description: 'Psychotherapy, 45 minutes', category: 'psychotherapy', duration: 45, isActive: true, rate: 150 },
    { code: '90837', description: 'Psychotherapy, 60 minutes', category: 'psychotherapy', duration: 60, isActive: true, rate: 180 },
    { code: '90832', description: 'Psychotherapy, 30 minutes', category: 'psychotherapy', duration: 30, isActive: true, rate: 120 },
    { code: '90836', description: 'Psychotherapy, 45 minutes with E/M', category: 'psychotherapy', duration: 45, isActive: true, rate: 170 },
    { code: '90838', description: 'Psychotherapy, 60 minutes with E/M', category: 'psychotherapy', duration: 60, isActive: true, rate: 200 },
    { code: '90847', description: 'Family psychotherapy with patient present', category: 'family', duration: 50, isActive: true, rate: 160 },
    { code: '90846', description: 'Family psychotherapy without patient present', category: 'family', duration: 50, isActive: true, rate: 160 },
    { code: '90853', description: 'Group psychotherapy', category: 'group', duration: 90, isActive: true, rate: 80 }
  ]);

  private icd10Codes = signal<ICD10Code[]>([
    { code: 'F41.1', description: 'Generalized anxiety disorder', category: 'Anxiety Disorders', isActive: true },
    { code: 'F41.9', description: 'Anxiety disorder, unspecified', category: 'Anxiety Disorders', isActive: true },
    { code: 'F41.0', description: 'Panic disorder without agoraphobia', category: 'Anxiety Disorders', isActive: true },
    { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified', category: 'Mood Disorders', isActive: true },
    { code: 'F33.9', description: 'Major depressive disorder, recurrent, unspecified', category: 'Mood Disorders', isActive: true },
    { code: 'F32.0', description: 'Major depressive disorder, single episode, mild', category: 'Mood Disorders', isActive: true },
    { code: 'F32.1', description: 'Major depressive disorder, single episode, moderate', category: 'Mood Disorders', isActive: true },
    { code: 'F32.2', description: 'Major depressive disorder, single episode, severe without psychotic features', category: 'Mood Disorders', isActive: true },
    { code: 'F43.10', description: 'Post-traumatic stress disorder, unspecified', category: 'Trauma and Stressor-Related Disorders', isActive: true },
    { code: 'F43.12', description: 'Post-traumatic stress disorder, chronic', category: 'Trauma and Stressor-Related Disorders', isActive: true },
    { code: 'F43.0', description: 'Acute stress reaction', category: 'Trauma and Stressor-Related Disorders', isActive: true },
    { code: 'F90.9', description: 'Attention-deficit hyperactivity disorder, unspecified type', category: 'Neurodevelopmental Disorders', isActive: true }
  ]);

  // Insurance CRUD
  getInsurances(): Observable<Insurance[]> {
    return of(this.insurances()).pipe(delay(300));
  }

  getInsurancesByPatient(patientId: string): Observable<Insurance[]> {
    return of(this.insurances().filter(ins => ins.patientId === patientId)).pipe(delay(300));
  }

  getInsuranceById(id: string): Observable<Insurance | undefined> {
    return of(this.insurances().find(ins => ins.id === id)).pipe(delay(300));
  }

  createInsurance(insurance: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>): Observable<Insurance> {
    const newInsurance: Insurance = {
      ...insurance,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.insurances.update(insurances => [...insurances, newInsurance]);
    return of(newInsurance).pipe(delay(500));
  }

  updateInsurance(id: string, updates: Partial<Insurance>): Observable<Insurance> {
    const currentInsurances = this.insurances();
    const index = currentInsurances.findIndex(ins => ins.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Insurance not found'));
    }

    const updatedInsurance = {
      ...currentInsurances[index],
      ...updates,
      updatedAt: new Date()
    };

    this.insurances.update(insurances => {
      const newInsurances = [...insurances];
      newInsurances[index] = updatedInsurance;
      return newInsurances;
    });

    return of(updatedInsurance).pipe(delay(500));
  }

  deleteInsurance(id: string): Observable<boolean> {
    this.insurances.update(insurances => insurances.filter(ins => ins.id !== id));
    return of(true).pipe(delay(500));
  }

  setPrimaryInsurance(patientId: string, insuranceId: string): Observable<boolean> {
    this.insurances.update(insurances => 
      insurances.map(ins => ({
        ...ins,
        isPrimary: ins.patientId === patientId ? ins.id === insuranceId : ins.isPrimary,
        updatedAt: new Date()
      }))
    );
    return of(true).pipe(delay(500));
  }

  // Eligibility Checks
 checkEligibility(id: string): Observable<EligibilityCheck> {
  return this.http.post(
    `${environment.apidev}/Billing/RunInsuranceEligibilityCheck`,
    JSON.stringify(id),
    { headers: { 'Content-Type': 'application/json' } }
  ).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching user by ID:', error);
      return throwError(() => error);
    })
  );

    
    // const insurance = this.insurances().find(ins => ins.id === insuranceId);
    // if (!insurance) {
    //   return throwError(() => new Error('Insurance not found'));
    // }

    // // Mock eligibility response
    // const eligibilityCheck: EligibilityCheck = {
    //   id: this.generateId(),
    //   patientId: insurance.patientId,
    //   insuranceId: insuranceId,
    //   checkDate: new Date(),
    //   status: 'completed',
    //   eligibilityStatus: 'active',
    //   effectiveDate: insurance.effectiveDate,
    //   copay: insurance.copay,
    //   deductible: insurance.deductible,
    //   deductibleMet: Math.floor(Math.random() * (insurance.deductible || 1000)),
    //   outOfPocketMax: insurance.outOfPocketMax,
    //   outOfPocketMet: Math.floor(Math.random() * (insurance.outOfPocketMax || 5000)),
    //   mentalHealthBenefits: insurance.mentalHealthCoverage,
    //   authorizationRequired: insurance.authorizationRequired,
    //   visitLimit: 26,
    //   visitsUsed: Math.floor(Math.random() * 10),
    //   planType: insurance.planType.toUpperCase(),
    //   networkStatus: insurance.networkStatus,
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // };

    // this.eligibilityChecks.update(checks => [...checks, eligibilityCheck]);
    // return of(eligibilityCheck).pipe(delay(2000)); // Simulate API call delay
  }

  getEligibilityChecks(): Observable<EligibilityCheck[]> {
    return of(this.eligibilityChecks()).pipe(delay(300));
  }

  getEligibilityChecksByPatient(patientId: string): Observable<EligibilityCheck[]> {
    return of(this.eligibilityChecks().filter(check => check.patientId === patientId)).pipe(delay(300));
  }

  // Claims CRUD
  getClaims(): Observable<InsuranceClaim[]> {
    return of(this.claims()).pipe(delay(300));
  }

  getClaimsByPatient(patientId: string): Observable<InsuranceClaim[]> {
    return of(this.claims().filter(claim => claim.patientId === patientId)).pipe(delay(300));
  }

  getClaimById(id: string): Observable<InsuranceClaim | undefined> {
    return of(this.claims().find(claim => claim.id === id)).pipe(delay(300));
  }

 

  updateClaim(id: string, updates: Partial<InsuranceClaim>): Observable<InsuranceClaim> {
    const currentClaims = this.claims();
    const index = currentClaims.findIndex(claim => claim.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Claim not found'));
    }

    const updatedClaim = {
      ...currentClaims[index],
      ...updates,
      updatedAt: new Date()
    };

    this.claims.update(claims => {
      const newClaims = [...claims];
      newClaims[index] = updatedClaim;
      return newClaims;
    });

    return of(updatedClaim).pipe(delay(500));
  }

  deleteClaim(id: string): Observable<boolean> {
    this.claims.update(claims => claims.filter(claim => claim.id !== id));
    return of(true).pipe(delay(500));
  }

  submitClaim(claimId: string): Observable<InsuranceClaim> {
    return this.updateClaim(claimId, {
      status: 'submitted',
      submissionDate: new Date()
    });
  }

  // Superbills CRUD
  getSuperbills(): Observable<Superbill[]> {
    return of(this.superbills()).pipe(delay(300));
  }

  getSuperbillsByPatient(patientId: string): Observable<Superbill[]> {
    return of(this.superbills().filter(sb => sb.patientId === patientId)).pipe(delay(300));
  }

  getSuperbillById(id: string): Observable<Superbill | undefined> {
    return of(this.superbills().find(sb => sb.id === id)).pipe(delay(300));
  }

  createSuperbill(superbill: Omit<Superbill, 'id' | 'createdAt' | 'updatedAt'>): Observable<Superbill> {
    const newSuperbill: Superbill = {
      ...superbill,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.superbills.update(superbills => [...superbills, newSuperbill]);
    return of(newSuperbill).pipe(delay(500));
  }

  updateSuperbill(id: string, updates: Partial<Superbill>): Observable<Superbill> {
    const currentSuperbills = this.superbills();
    const index = currentSuperbills.findIndex(sb => sb.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Superbill not found'));
    }

    const updatedSuperbill = {
      ...currentSuperbills[index],
      ...updates,
      updatedAt: new Date()
    };

    this.superbills.update(superbills => {
      const newSuperbills = [...superbills];
      newSuperbills[index] = updatedSuperbill;
      return newSuperbills;
    });

    return of(updatedSuperbill).pipe(delay(500));
  }

  deleteSuperbill(id: string): Observable<boolean> {
    this.superbills.update(superbills => superbills.filter(sb => sb.id !== id));
    return of(true).pipe(delay(500));
  }

  finalizeSuperbill(id: string): Observable<Superbill> {
    return this.updateSuperbill(id, { status: 'finalized' });
  }

  // Reference Data
  getCPTCodes(): Observable<CPTCode[]> {
    return of(this.cptCodes()).pipe(delay(300));
  }

  getICD10Codes(): Observable<ICD10Code[]> {
    return of(this.icd10Codes()).pipe(delay(300));
  }

  getInsuranceProviders(): Observable<InsuranceProvider[]> {
    const providers: InsuranceProvider[] = [
      {
        id: '1',
        name: 'Blue Cross Blue Shield',
        payerCode: 'BCBS',
        address: '123 Insurance Ave, Chicago, IL 60601',
        phone: '1-800-BCBS-123',
        website: 'www.bcbs.com',
        electronicSubmission: true,
        isActive: true
      },
      {
        id: '2',
        name: 'Aetna',
        payerCode: 'AETNA',
        address: '456 Health Blvd, Hartford, CT 06156',
        phone: '1-800-AETNA-01',
        website: 'www.aetna.com',
        electronicSubmission: true,
        isActive: true
      }
    ];
    return of(providers).pipe(delay(300));
  }

  // Statistics
  getClaimStats(): Observable<ClaimStats> {
    const claims = this.claims();
    const stats: ClaimStats = {
      totalClaims: claims.length,
      pendingClaims: claims.filter(c => c.status === 'pending').length,
      paidClaims: claims.filter(c => c.status === 'approved' || c.status === 'paid').length,
      approvedClaims: claims.filter(c => c.status === 'approved' || c.status === 'paid').length,
      submittedClaims: claims.filter(c => c.status === 'submitted').length,
      deniedClaims: claims.filter(c => c.status === 'denied').length,
      totalAmount: claims.reduce((sum, c) => sum + c.totalAmount, 0),
      totalBilled: claims.reduce((sum, c) => sum + c.totalAmount, 0),
      paidAmount: claims.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
      totalPaid: claims.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
      deniedAmount: 0,
      pendingAmount: 0,
      averageProcessingTime: 14, // days
      denialRate: 5.2 // percentage
    };
    return of(stats).pipe(delay(300));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // ERA/EOB Management
  getERAs(): Observable<ERA[]> {
    // Mock ERA data
    const mockERAs: ERA[] = [
      {
        id: 'era-1',
        clientId: 'client-lotus',
        payerName: 'Blue Cross Blue Shield',
        payerIdentifier: 'BCBS001',
        checkNumber: 'CHK123456',
        checkDate: new Date(2025, 0, 15),
        totalPaymentAmount: 450.00,
        paymentMethod: 'ACH',
        traceNumber: 'TRC789012',
        claims: [
          {
            id: 'era-claim-1',
            claimId: 'claim-1',
            patientControlNumber: 'PCN001',
            patientName: 'John Smith',
            serviceDate: new Date(2025, 0, 10),
            totalChargeAmount: 150.00,
            totalPaymentAmount: 120.00,
            totalPatientResponsibility: 30.00,
            claimStatus: 'paid',
            services: [
              {
                id: 'era-svc-1',
                procedureCode: '90834',
                serviceDate: new Date(2025, 0, 10),
                units: 1,
                chargedAmount: 150.00,
                allowedAmount: 120.00,
                paidAmount: 96.00,
                deductibleAmount: 0.00,
                coinsuranceAmount: 24.00,
                copayAmount: 0.00,
                adjustments: [
                  {
                    id: 'adj-1',
                    adjustmentCode: 'CO-45',
                    adjustmentReason: 'Contractual adjustment',
                    adjustmentAmount: 30.00,
                    adjustmentType: 'contractual'
                  }
                ],
                remarks: []
              }
            ],
            adjustments: [],
            remarks: []
          }
        ],
        status: 'received',
        receivedAt: new Date(2025, 0, 15),
        createdAt: new Date(2025, 0, 15),
        updatedAt: new Date(2025, 0, 15)
      }
    ];
    
    return of(mockERAs).pipe(delay(300));
  }

  getERAById(id: string): Observable<ERA | undefined> {
    return this.getERAs().pipe(
      map(eras => eras.find(era => era.id === id))
    );
  }

processERA(eraFile: File): Observable<ERAProcessingResult> {
  const formData = new FormData();
  formData.append('File', eraFile); // Change 'eraFile' to 'File'
  
  return this.http.post<ERAProcessingResult>(`${environment.apidev}/ERA/UploadERA`, formData).pipe(
    map((response: any) => {
      return response?.data || response;
    }),
    catchError(error => {
      console.error('Error during ERA file processing:', error);
      return throwError(() => error);
    })
  );
}



GetPendingPaymentsByPatientId(id:string){
  let params = new HttpParams();
  if (id) {
    params = params.set('patientId', id);
  }
    return this.http.get(`${environment.apidev}/Payments/GetPendingPaymentsByPatientId`,{params}).pipe(
      map((response: any) => response), 
      catchError((error) => {
        console.error('Error GetInsuranceByPatientId:', error);
        return throwError(() => error);
      })
    );
}

  getEOBs(): Observable<EOB[]> {
    // Mock EOB data
    const mockEOBs: EOB[] = [
      {
        id: 'eob-1',
        clientId: 'client-lotus',
        patientId: 'patient-1',
        claimId: 'claim-1',
        eraId: 'era-1',
        payerName: 'Blue Cross Blue Shield',
        payerAddress: '123 Insurance Ave, Chicago, IL 60601',
        subscriberName: 'John Smith',
        subscriberId: 'SUB123456',
        patientName: 'John Smith',
        providerName: 'Dr. Sarah Johnson',
        providerNPI: '1234567890',
        claimNumber: 'CLM-2025-001',
        serviceDate: new Date(2025, 0, 10),
        receivedDate: new Date(2025, 0, 15),
        processedDate: new Date(2025, 0, 15),
        totalCharges: 150.00,
        totalAllowed: 120.00,
        totalPaid: 96.00,
        totalPatientResponsibility: 24.00,
        deductibleAmount: 0.00,
        coinsuranceAmount: 24.00,
        copayAmount: 0.00,
        services: [
          {
            id: 'eob-svc-1',
            procedureCode: '90834',
            description: 'Psychotherapy, 45 minutes',
            serviceDate: new Date(2025, 0, 10),
            units: 1,
            chargedAmount: 150.00,
            allowedAmount: 120.00,
            paidAmount: 96.00,
            deductibleAmount: 0.00,
            coinsuranceAmount: 24.00,
            copayAmount: 0.00,
            remarks: ['Service covered under mental health benefits']
          }
        ],
        remarks: ['Payment processed successfully'],
        appealRights: 'You have the right to appeal this decision within 60 days',
        status: 'posted',
        isElectronic: true,
        createdAt: new Date(2025, 0, 15),
        updatedAt: new Date(2025, 0, 15)
      }
    ];
    
    return of(mockEOBs).pipe(delay(300));
  }

  getEOBById(id: string): Observable<EOB | undefined> {
    return this.getEOBs().pipe(
      map(eobs => eobs.find(eob => eob.id === id))
    );
  }

  searchEOBs(criteria: EOBSearch): Observable<EOB[]> {
    return this.getEOBs().pipe(
      map(eobs => {
        let filtered = eobs;
        
        if (criteria.patientId) {
          filtered = filtered.filter(eob => eob.patientId === criteria.patientId);
        }
        
        if (criteria.claimId) {
          filtered = filtered.filter(eob => eob.claimId === criteria.claimId);
        }
        
        if (criteria.payerName) {
          filtered = filtered.filter(eob => 
            eob.payerName.toLowerCase().includes(criteria.payerName!.toLowerCase())
          );
        }
        
        if (criteria.dateFrom) {
          filtered = filtered.filter(eob => eob.serviceDate >= criteria.dateFrom!);
        }
        
        if (criteria.dateTo) {
          filtered = filtered.filter(eob => eob.serviceDate <= criteria.dateTo!);
        }
        
        if (criteria.status) {
          filtered = filtered.filter(eob => eob.status === criteria.status);
        }
        
        if (criteria.isElectronic !== undefined) {
          filtered = filtered.filter(eob => eob.isElectronic === criteria.isElectronic);
        }
        
        return filtered;
      })
    );
  }

  searchERAs(criteria: ERASearch): Observable<ERA[]> {
    return this.getERAs().pipe(
      map(eras => {
        let filtered = eras;
        
        if (criteria.payerName) {
          filtered = filtered.filter(era => 
            era.payerName.toLowerCase().includes(criteria.payerName!.toLowerCase())
          );
        }
        
        if (criteria.checkNumber) {
          filtered = filtered.filter(era => 
            era.checkNumber.toLowerCase().includes(criteria.checkNumber!.toLowerCase())
          );
        }
        
        if (criteria.dateFrom) {
          filtered = filtered.filter(era => era.checkDate >= criteria.dateFrom!);
        }
        
        if (criteria.dateTo) {
          filtered = filtered.filter(era => era.checkDate <= criteria.dateTo!);
        }
        
        if (criteria.status) {
          filtered = filtered.filter(era => era.status === criteria.status);
        }
        
        if (criteria.paymentMethod) {
          filtered = filtered.filter(era => era.paymentMethod === criteria.paymentMethod);
        }
        
        return filtered;
      })
    );
  }

  postERAPayments(eraId: string): Observable<boolean> {
    // Mock posting ERA payments to patient accounts
    return of(true).pipe(delay(1000));
  }

  reconcileERA(eraId: string): Observable<boolean> {
    // Mock reconciliation process
    return of(true).pipe(delay(1500));
  }

  generateEOBReport(eobId: string): Observable<Blob> {
    // Mock EOB report generation
    const mockPdfContent = 'Mock EOB PDF content';
    const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
    return of(blob).pipe(delay(1000));
  }


  getInsuranceByIds(id:string){
    return this.http.get(`${environment.apidev}/Insurances/${id}`).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching allergy data:', error);
        return throwError(() => error);
      })
    );
  }

deleteInsuranceIds(id: string) {
  return this.http.delete(`${environment.apidev}/Insurances/${id}`).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error fetching insurance claims:', error);
      return throwError(() => error);
    })
  );
}

updateInsuranceIds(id: string, data: any) {
  const params = new HttpParams()
   .set('id', id.toString());
  return this.http.put(`${environment.apidev}/InsuranceAndClaims/UpdateInsurance`, data, { params }).pipe(
    map((response: any) => response?.data || response),
    catchError(error => {
      console.error('Error updating insurance:', error);
      return throwError(() => error);
    })
  );
}


  getPrimaryInsurance(insuranceId: string, patientId: string){
     const payload = { patientId, isPrimary: true };

  return this.http.post(
    `${environment.apidev}/Insurances/${insuranceId}/set-primary`,
    payload
  ).pipe(
    map((response: any) => response),
    catchError(error => {
      console.error('Error setting primary insurance:', error);
      return throwError(() => error);
    })
  );
  }

   GetInsurancesByPatientId(patientId: string): Observable<any> {
    return this.http.get(`${environment.apidev}/Insurances/GetInsurancesByPatientId`, {
      params: { patientId }
    });
  }

   createClaim(data:string): Observable<any> {
     return this.http.post(`${environment.apidev}/Billing/SubmitClaim`,data).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching allergy data:', error);
        return throwError(() => error);
      })
    );
  }
  getClaimsByPatients(patientId:string):Observable<any>{
    const params = new HttpParams()
      .set('patientId', patientId.toString());
    return this.http.get(`${environment.apidev}/Billing/GetClaimsByPatient`,{params}).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching allergy data:', error);
        return throwError(() => error);
      })
    );
  }

    getClaimsById(patientId:string):Observable<any>{
    const params = new HttpParams()
      .set('patientId', patientId.toString());
    return this.http.get(`${environment.apidev}/Billing/GetClaims`,{params}).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching allergy data:', error);
        return throwError(() => error);
      })
    );
  }

   getClaimsByClaimsId(claimId:string):Observable<any>{
    const params = new HttpParams()
      .set('claimId', claimId.toString());
    return this.http.get(`${environment.apidev}/Billing/GetClaimById`,{params}).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching allergy data:', error);
        return throwError(() => error);
      })
    );
  }



   createPaymentsRequest(data:string): Observable<any> {
     return this.http.post(`${environment.apidev}/Payments/CreatePaymentRequest
 `,data).pipe(
      map((response: any) => response?.data || response),
      catchError(error => {
        console.error('Error fetching allergy data:', error);
        return throwError(() => error);
      })
    );
  }
}