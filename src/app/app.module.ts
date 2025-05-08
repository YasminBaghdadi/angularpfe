import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { ReactiveFormsModule } from '@angular/forms'; 

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { PlatComponent } from './plat/plat.component';
import { FooterComponent } from './public/footer/footer.component';
import { HeaderComponent } from './public/header/header.component';
import { HeaderfooterComponent } from './public/headerfooter/headerfooter.component';
import { RegisterComponent } from './auth/register/register.component';
import { PanierComponent } from './panier/panier.component';
import { ReservationComponent } from './reservation/reservation.component';
import { DashComponent } from './livreur/dash/dash.component';
import { LoginComponent } from './auth/login/login.component';



import { PlatService } from './services/plat.service';
import { PanierService } from './services/panier.service';
import { ReservationService } from './services/reservation.service';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { CustomersComponent } from './admin/customers/customers.component';
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PlatComponent,
    FooterComponent,
    HeaderComponent,
    HeaderfooterComponent,
    RegisterComponent,
    LoginComponent,
    PanierComponent,
    ReservationComponent,
    DashComponent,
    DashboardComponent,
    CustomersComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,           // Importé pour ngModel
    ReactiveFormsModule    // Importé pour les formulaires réactifs
  ],
  providers: [
    PlatService,
    PanierService, 
    ReservationService,
    
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
