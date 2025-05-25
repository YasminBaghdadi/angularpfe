export interface PaymentRequest {
  amount: number;
  currency: string;
  idCommande: number;
}

export interface PaymentExecutionRequest {
  paymentId: string;
  payerId: string;
}

export interface PaymentStatusResponse {
  idCommande: number;
  statut: string;
  montant?: number;
  datePaiement?: Date;
  paypalPaymentId?: string;
}