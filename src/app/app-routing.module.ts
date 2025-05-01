import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HeaderfooterComponent } from './headerfooter/headerfooter.component';
import { HomeComponent } from './home/home.component';
import { PlatComponent } from './plat/plat.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { PanierComponent } from './panier/panier.component';
import { ReservationComponent } from './reservation/reservation.component';

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
