import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HeaderfooterComponent } from './public/headerfooter/headerfooter.component';
import { HomeComponent } from './home/home.component';
import { PlatComponent } from './plat/plat.component';
import { RegisterComponent } from './auth/register/register.component';
import { PanierComponent } from './panier/panier.component';
import { ReservationComponent } from './reservation/reservation.component';
import { LoginComponent } from './auth/login/login.component';
import { DashComponent } from './livreur/dash/dash.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { CustomersComponent } from './admin/customers/customers.component';
import { AuthGuard } from './guard/auth.guard';
import { roleGuard } from './role/role.guard';
import { AccueilClientComponent } from './client/accueil-client/accueil-client.component';
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
import { PaymentCancelComponent } from './payment-cancel/payment-cancel.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { SimplePaymentCancelComponent} from './simple-payment-cancel/simple-payment-cancel.component';
import { SimplePaymentSuccessComponent } from './simple-payment-success/simple-payment-success.component';
import { ModifierprofilComponent } from './modifierprofil/modifierprofil.component';
import { CommandeeComponent } from './admin/commandee/commandee.component';
import { AdminReservationComponent } from './admin/admin-reservation/admin-reservation.component';
import { ChatComponent } from './chat-component/chat-component.component';
const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  { 
    path: 'accueil', 
    component: HeaderfooterComponent,
    children: [
      { path: '', component: HomeComponent },
    ]
  },


   // Routes de paiement en premier
  { path: 'simple-payment-success', component: SimplePaymentSuccessComponent },
  { path: 'simple-payment-cancel', component: SimplePaymentCancelComponent },
  { path: 'paiement', component: PaymentComponent },
  { path: 'payment/success', component: PaymentSuccessComponent },
  { path: 'payment/cancel', component: PaymentCancelComponent },
  { 
    path: 'plat', 
    component: HeaderfooterComponent,  
    children: [
      { path: '', component: PlatComponent },
    ]

  },

    { path: 'modifier', component: ModifierprofilComponent },



  { 
    path: 'reservation', 
    component: HeaderfooterComponent,  
    children: [
      { path: '', component: ReservationComponent },
    ]

  },



  { 
    path: 'panier',
    component: HeaderfooterComponent,
    children: [
      { path: '', component: PanierComponent },
    ]
  },

  { 
  path: 'dash',
  component: DashComponent,
  canActivate: [AuthGuard, roleGuard],
  data: { expectedRole: 'LIVREUR' } 

  },


  { 
    path: 'dashboard',  
    component: DashboardComponent,  
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'ADMIN' } 
  },


  

 

{ 
  path: 'interface-table/:tableNumber',  
  component: InterfaceComponent 
},

  { 
    path: 'profil',  
    component: ProfilComponent,
    
  },

 

  { 
    path: 'panierPassager-table/:tableNumber',  
    component: PanierPassagerComponent,  
    
  },
 { 
    path: 'chat',  
    component: ChatComponent,  
    
  },
{ 
    path: 'admin/commande',  
    component: CommandeeComponent,
    
  },

  { 
    path: 'admin/reservation',  
    component: AdminReservationComponent,
    
  },


 
 { 
    path: 'customers',  
    component: CustomersComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'ADMIN' } 
  },


  { 
    path: 'menu',  
    component: MenuComponent,  
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'ADMIN' } 
  },

  

  { 
    path: 'client/accueilClient',  
    component: AccueilClientComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'CLIENT' }   
   
  },
  { 
    path: 'client/plats',  
    component: PlatsComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'CLIENT' } 
  },
 { 
    path: 'client/reservations',  
    component: ReservationsComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'CLIENT' } 
  },
  


{ 
    path: 'client/pan',  
    component: PanComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'CLIENT' } 
  },
  
  { 
    path: 'livreurs',  
    component: LivreurComponent,
     canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'ADMIN' } 

  },
  { 
    path: 'table',  
    component: TableComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: 'ADMIN' } 
  },
  

  
  { 
    path: 'register',  
    component: RegisterComponent,  
  },

  
  { 
    path: 'login',  
    component: LoginComponent,  
  },


 
  
 
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }



