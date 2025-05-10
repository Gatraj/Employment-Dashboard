export interface BlsApiResponse {
  status: string;
  responseTime: number;
  message?: string[];
  Results: {
    series: Array<{
      seriesID: string;
      data: Array<{
        year: string;
        period: string;
        periodName: string;
        value: string;
        footnotes: Array<{
          code: string;
          text: string;
        }>;
      }>;
    }>;
  };
}

export interface ProcessedData {
  date: Date;
  value: number;
  year: number;
  month: number;
  periodName: string;
}

export interface BlsRequestBody {
  seriesid: string[];
  startyear: string;
  endyear: string;
  registrationkey?: string;
  calculations?: boolean;
  annualaverage?: boolean;
} 