import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BlsApiResponse, ProcessedData, BlsRequestBody } from '../interfaces/bls.interface';

// Add California counties interface
export interface County {
  name: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlsService {
  private readonly baseUrl = environment.bls.apiUrl;
  private readonly apiKey = environment.bls.apiKey;
  private cache = new Map<string, { data: ProcessedData[], timestamp: number }>();
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds

  // Add California counties data
  private readonly caCounties: County[] = [
    { name: 'Alameda County', code: '001' },
    { name: 'Alpine County', code: '003' },
    { name: 'Amador County', code: '005' },
    { name: 'Butte County', code: '007' },
    { name: 'Calaveras County', code: '009' },
    { name: 'Colusa County', code: '011' },
    { name: 'Contra Costa County', code: '013' },
    { name: 'Del Norte County', code: '015' },
    { name: 'El Dorado County', code: '017' },
    { name: 'Fresno County', code: '019' },
    { name: 'Glenn County', code: '021' },
    { name: 'Humboldt County', code: '023' },
    { name: 'Imperial County', code: '025' },
    { name: 'Inyo County', code: '027' },
    { name: 'Kern County', code: '029' },
    { name: 'Kings County', code: '031' },
    { name: 'Lake County', code: '033' },
    { name: 'Lassen County', code: '035' },
    { name: 'Los Angeles County', code: '037' },
    { name: 'Madera County', code: '039' },
    { name: 'Marin County', code: '041' },
    { name: 'Mariposa County', code: '043' },
    { name: 'Mendocino County', code: '045' },
    { name: 'Merced County', code: '047' },
    { name: 'Modoc County', code: '049' },
    { name: 'Mono County', code: '051' },
    { name: 'Monterey County', code: '053' },
    { name: 'Napa County', code: '055' },
    { name: 'Nevada County', code: '057' },
    { name: 'Orange County', code: '059' },
    { name: 'Placer County', code: '061' },
    { name: 'Plumas County', code: '063' },
    { name: 'Riverside County', code: '065' },
    { name: 'Sacramento County', code: '067' },
    { name: 'San Benito County', code: '069' },
    { name: 'San Bernardino County', code: '071' },
    { name: 'San Diego County', code: '073' },
    { name: 'San Francisco County', code: '075' },
    { name: 'San Joaquin County', code: '077' },
    { name: 'San Luis Obispo County', code: '079' },
    { name: 'San Mateo County', code: '081' },
    { name: 'Santa Barbara County', code: '083' },
    { name: 'Santa Clara County', code: '085' },
    { name: 'Santa Cruz County', code: '087' },
    { name: 'Shasta County', code: '089' },
    { name: 'Sierra County', code: '091' },
    { name: 'Siskiyou County', code: '093' },
    { name: 'Solano County', code: '095' },
    { name: 'Sonoma County', code: '097' },
    { name: 'Stanislaus County', code: '099' },
    { name: 'Sutter County', code: '101' },
    { name: 'Tehama County', code: '103' },
    { name: 'Trinity County', code: '105' },
    { name: 'Tulare County', code: '107' },
    { name: 'Tuolumne County', code: '109' },
    { name: 'Ventura County', code: '111' },
    { name: 'Yolo County', code: '113' },
    { name: 'Yuba County', code: '115' }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Get list of California counties
   */
  getCaliforniaCounties(): Observable<County[]> {
    return of(this.caCounties);
  }

  /**
   * Get unemployment rate data for a specific California county
   * @param countyCode County code
   * @param startYear Start year in YYYY format
   * @param endYear End year in YYYY format
   */
  getCountyUnemploymentRate(countyCode: string, startYear: string, endYear: string): Observable<ProcessedData[]> {
    const seriesId = `LAUCN06${countyCode}0000000003`; // California county unemployment rate
    const cacheKey = `unemployment-ca-${countyCode}-${startYear}-${endYear}`;
    
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.fetchData(seriesId, startYear, endYear).pipe(
      tap(data => this.setInCache(cacheKey, data))
    );
  }

  /**
   * Get unemployment rate data for a specific state
   * @param stateCode Two-letter state code
   * @param startYear Start year in YYYY format
   * @param endYear End year in YYYY format
   */
  getUnemploymentRate(stateCode: string, startYear: string, endYear: string): Observable<ProcessedData[]> {
    const seriesId = `LAUST${stateCode}0000000000003`; // State unemployment rate, seasonally adjusted
    const cacheKey = `unemployment-${stateCode}-${startYear}-${endYear}`;
    
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.fetchData(seriesId, startYear, endYear).pipe(
      tap(data => this.setInCache(cacheKey, data))
    );
  }

  /**
   * Get employment data for a specific industry
   * @param industryCode Industry code
   * @param startYear Start year in YYYY format
   * @param endYear End year in YYYY format
   */
  getIndustryEmployment(industryCode: string, startYear: string, endYear: string): Observable<ProcessedData[]> {
    const seriesId = `CEU${industryCode}01`; // Industry employment
    const cacheKey = `industry-${industryCode}-${startYear}-${endYear}`;
    
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.fetchData(seriesId, startYear, endYear).pipe(
      tap(data => this.setInCache(cacheKey, data))
    );
  }

  /**
   * Get national employment data
   * @param startYear Start year in YYYY format
   * @param endYear End year in YYYY format
   */
  getNationalEmployment(startYear: string, endYear: string): Observable<ProcessedData[]> {
    const seriesId = 'LNS12000000'; // National employment level
    const cacheKey = `national-employment-${startYear}-${endYear}`;
    
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.fetchData(seriesId, startYear, endYear).pipe(
      tap(data => this.setInCache(cacheKey, data))
    );
  }

  private fetchData(seriesId: string, startYear: string, endYear: string): Observable<ProcessedData[]> {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const body: BlsRequestBody = {
      seriesid: [seriesId],
      startyear: startYear,
      endyear: endYear,
      registrationkey: this.apiKey || undefined,
      calculations: false,
      annualaverage: false
    };

    return this.http.post<BlsApiResponse>(this.baseUrl, body, { 
      headers,
      withCredentials: false
    }).pipe(
      retry(2), // Retry failed requests up to 2 times
      map(response => {
        if (!response || !response.Results || !response.Results.series || response.Results.series.length === 0) {
          throw new Error('No data available for the selected criteria');
        }
        if (response.status !== 'REQUEST_SUCCEEDED') {
          throw new Error(response.message?.join(', ') || 'BLS API request failed');
        }
        return this.transformData(response);
      }),
      catchError(this.handleError)
    );
  }

  private transformData(response: BlsApiResponse): ProcessedData[] {
    if (!response.Results?.series?.[0]?.data) {
      return [];
    }

    return response.Results.series[0].data
      .map(item => {
        const month = parseInt(item.period.replace('M', ''));
        return {
          date: new Date(parseInt(item.year), month - 1),
          value: parseFloat(item.value),
          year: parseInt(item.year),
          month: month,
          periodName: item.periodName
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching data from BLS API';

    // Fix for Node.js environments where ErrorEvent is not defined
    if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to BLS API. Please check your internet connection.';
      } else if (error.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (error.status === 403) {
        errorMessage = 'Access to BLS API is forbidden. Please check your API key.';
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error('BLS API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private getFromCache(key: string): ProcessedData[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setInCache(key: string, data: ProcessedData[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear the service cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
