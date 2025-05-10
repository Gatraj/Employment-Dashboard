import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface EmploymentData {
  year: number;
  month: number;
  value: number;
  rate: number;
}

@Injectable({
  providedIn: 'root'
})
export class BlsService {
  private readonly API_KEY = '6f7f260646fe493d9e7a654999616856';
  private readonly BASE_URL = 'https://api.bls.gov/publicAPI/v2';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getCounties(): Observable<string[]> {
    // Always return mock data for counties to avoid API calls during prerendering
    return of([
      'Los Angeles County, CA',
      'Cook County, IL',
      'Harris County, TX',
      'Maricopa County, AZ',
      'San Diego County, CA'
    ]);
  }

  getEmploymentData(
    county: string,
    startYear: string,
    endYear: string
  ): Observable<EmploymentData[]> {
    // During prerendering, return mock data
    if (!isPlatformBrowser(this.platformId)) {
      return this.getMockEmploymentData(startYear, endYear);
    }

    // In browser, try to fetch real data or fall back to mock data
    try {
      // Here you would make the actual API call
      // For now, still using mock data since the real implementation isn't complete
      return this.getMockEmploymentData(startYear, endYear);
      
      // When ready to implement real API calls:
      // return this.fetchFromBLS(seriesId, startYear, endYear).pipe(
      //   catchError(() => this.getMockEmploymentData(startYear, endYear))
      // );
    } catch (error) {
      return this.getMockEmploymentData(startYear, endYear);
    }
  }

  private getMockEmploymentData(startYear: string, endYear: string): Observable<EmploymentData[]> {
    const data: EmploymentData[] = [];
    const start = parseInt(startYear);
    const end = parseInt(endYear);
    
    for (let year = start; year <= end; year++) {
      for (let month = 1; month <= 12; month++) {
        data.push({
          year,
          month,
          value: Math.floor(Math.random() * 100000) + 500000, // Random employment number
          rate: Math.random() * 5 + 3 // Random unemployment rate between 3-8%
        });
      }
    }
    
    return of(data);
  }

  // Example of how to make a real BLS API call - only in browser environment
  private fetchFromBLS(
    seriesId: string,
    startYear: string,
    endYear: string
  ): Observable<any> {
    // Skip API calls during prerendering
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    const url = `${this.BASE_URL}/timeseries/data/`;
    const body = {
      seriesid: [seriesId],
      startyear: startYear,
      endyear: endYear,
      registrationkey: this.API_KEY
    };

    return this.http.post(url, body).pipe(
      map((response: any) => response.Results.series[0].data),
      catchError(error => {
        console.error('Error fetching BLS data:', error);
        return of([]);
      })
    );
  }
}