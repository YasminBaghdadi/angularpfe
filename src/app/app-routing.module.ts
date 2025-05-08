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



const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  { 
    path: 'accueil', 
    component: HeaderfooterComponent,
    children: [
      { path: '', component: HomeComponent },
    ]
  },
  { 
    path: 'plat', 
    component: HeaderfooterComponent,  
    children: [
      { path: '', component: PlatComponent },
    ]

  },


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
  },
  { 
    path: 'admin/dashboard',  
    component: DashboardComponent,  
  },



  { 
    path: 'admin/customers',  
    component: CustomersComponent,  
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
