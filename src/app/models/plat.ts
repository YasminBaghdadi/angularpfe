export interface Plat {
  idPlat: number;
  name: string;
  description: string | null;  // Peut être null
  prix: number;
  categorie: string; 
  imageUrl?: string;
  quantite?: number;
}
