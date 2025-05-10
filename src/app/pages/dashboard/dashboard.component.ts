import { Component, OnInit } from '@angular/core';
import { BlsService, EmploymentData } from '../../services/bls.service';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    HighchartsChartModule
  ]
})
export class DashboardComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    series: [{
      type: 'line',
      name: 'Unemployment Rate',
      data: []
    } as Highcharts.SeriesLineOptions]
  };

  hasData: boolean = false;
  counties: string[] = [];
  selectedCounty: string = '';
  startYear: string = '';
  endYear: string = '';
  chartData: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private blsService: BlsService) {}

  ngOnInit(): void {
    this.initializeDefaults();
    this.loadCounties();
  }

  private initializeDefaults(): void {
    const currentYear = new Date().getFullYear();
    this.startYear = (currentYear - 5).toString();
    this.endYear = currentYear.toString();
  }

  private loadCounties(): void {
    this.blsService.getCounties().subscribe({
      next: (counties) => {
        this.counties = counties;
        if (counties.length > 0) {
          this.selectedCounty = counties[0];
          this.fetchData();
        }
      },
      error: (error) => this.handleError('Failed to load counties', error)
    });
  }

  onCountyChange(county: string): void {
    this.selectedCounty = county;
    this.fetchData();
  }

  onStartYearChange(year: string): void {
    this.startYear = year;
    this.fetchData();
  }

  onEndYearChange(year: string): void {
    this.endYear = year;
    this.fetchData();
  }

  private fetchData(): void {
    if (!this.selectedCounty || !this.startYear || !this.endYear) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.blsService.getEmploymentData(this.selectedCounty, this.startYear, this.endYear)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data: EmploymentData[]) => {
          this.transformData(data);
        },
        error: (error) => this.handleError('Failed to fetch unemployment data', error)
      });
  }

  private transformData(data: EmploymentData[]): void {
    const chartData = data.map(item => [
      Date.UTC(item.year, item.month - 1),
      item.rate
    ]);
    
    this.hasData = chartData.length > 0;
    
    this.chartOptions = {
      title: { text: `Unemployment Rate - ${this.selectedCounty}` },
      xAxis: { type: 'datetime' },
      yAxis: { title: { text: 'Rate (%)' } },
      series: [{
        type: 'line',
        name: 'Unemployment Rate',
        data: chartData
      } as Highcharts.SeriesLineOptions]
    };
  }

  private handleError(message: string, error: any): void {
    this.error = `${message}: ${error.message || 'Unknown error'}`;
    console.error(error);
  }

  getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 20;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);
  }
}
