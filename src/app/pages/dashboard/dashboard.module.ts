import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { DashboardComponent } from './dashboard.component';
import { BlsService } from '../../services/bls.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgxChartsModule,
    DashboardComponent
  ],
  providers: [
    BlsService
  ],
  exports: [
    DashboardComponent
  ]
})
export class DashboardModule { } 