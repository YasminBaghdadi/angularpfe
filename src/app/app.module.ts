import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { ReactiveFormsModule } from '@angular/forms'; 

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { PlatComponent } from './plat/plat.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { HeaderfooterComponent } from './headerfooter/headerfooter.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { PanierComponent } from './panier/panier.component';
import { ReservationComponent } from './reservation/reservation.component';

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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,           // Importé pour ngModel
    ReactiveFormsModule    // Importé pour les formulaires réactifs
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
