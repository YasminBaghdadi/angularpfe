import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';


// Keycloak
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { ZXingScannerModule } from '@zxing/ngx-scanner';


// Composants
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { PlatComponent } from './plat/plat.component';
import { FooterComponent } from './public/footer/footer.component';
import { HeaderComponent } from './public/header/header.component';
import { HeaderfooterComponent } from './public/headerfooter/headerfooter.component';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { PanierComponent } from './panier/panier.component';
import { ReservationComponent } from './reservation/reservation.component';
import { DashComponent } from './livreur/dash/dash.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { CustomersComponent } from './admin/customers/customers.component';
import { AccueilClientComponent } from './client/accueil-client/accueil-client.component';
import { ChatComponent } from './chat-component/chat-component.component';
// Services
import { PlatService } from './services/plat.service';
import { PanierService } from './services/panier.service';
import { ReservationService } from './services/reservation.service';
import { AuthService } from './services/auth.service';
import { TableComponent } from './admin/table/table.component';
import { InterfaceComponent } from './clientPassager/interface/interface.component';
import { PanierPassagerComponent } from './clientPassager/panier-passager/panier-passager.component';
import { LivreurComponent } from './admin/livreur/livreur.component';
import { ProfilComponent } from './profil/profil.component';
import { PlatsComponent } from './client/plats/plats.component';
import { ReservationsComponent } from './client/reserv/reservations.component';
import { PanComponent } from './client/pan/pan.component';
import { MenuComponent } from './admin/menu/menu.component';
import { PaymentComponent } from './payment/payment.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentCancelComponent } from './payment-cancel/payment-cancel.component';
import { SimplePaymentSuccessComponent } from './simple-payment-success/simple-payment-success.component';
import { SimplePaymentCancelComponent } from './simple-payment-cancel/simple-payment-cancel.component';
import { ModifierprofilComponent } from './modifierprofil/modifierprofil.component';
import { CommandeeComponent } from './admin/commandee/commandee.component';
import { AdminReservationComponent } from './admin/admin-reservation/admin-reservation.component';
// Keycloak config
const keycloakConfig = {
  url: 'http://localhost:9090',
  realm: 'master',
  clientId: 'angular'
};

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: keycloakConfig,
      enableBearerInterceptor: true,
      bearerExcludedUrls: ['/assets'],
      initOptions: {
        pkceMethod: 'S256',
        timeSkew: 0
      }
    });
}

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
    AccueilClientComponent,
    TableComponent,
    InterfaceComponent,
    PanierPassagerComponent,
    LivreurComponent,
    ProfilComponent,
    PlatsComponent,
    ReservationComponent,
    ReservationsComponent,
    PanComponent,
    MenuComponent,
    PaymentComponent,
    PaymentSuccessComponent,
    PaymentCancelComponent,
    SimplePaymentSuccessComponent,
    SimplePaymentCancelComponent,
    ModifierprofilComponent,
    CommandeeComponent,
    AdminReservationComponent,
    ChatComponent
     ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ZXingScannerModule,
    KeycloakAngularModule
    ],
  providers: [
    PlatService,
    PanierService,
    ReservationService,
    AuthService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
