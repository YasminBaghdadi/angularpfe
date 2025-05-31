// restaurant-chat.service.ts
import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BehaviorSubject, Observable } from 'rxjs';
import { PlatService } from './plat.service';
import { Plat } from '../models/plat';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ApiUsageInfo {
  requestCount: number;
  lastResetTime: number;
  dailyCount: number;
  lastDailyReset: number;
}

@Injectable({
  providedIn: 'root'
})
export class RestaurantChatService {
  private genAI = new GoogleGenerativeAI('AIzaSyBbTyZXcn-JlNAiWB2Xuq3TYZ0TV05RAaA');
  private model = this.genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash'
  });

  private chatHistory: any[] = [];
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  // Cache pour les plats pour éviter les appels répétés à l'API
  private platsCache = new Map<string, Plat[]>();
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 300000; // 5 minutes

  // Gestion des quotas
  private readonly STORAGE_KEY = 'gemini_api_usage';
  private readonly MAX_REQUESTS_PER_MINUTE = 15;
  private readonly MAX_DAILY_REQUESTS = 1500;
  private readonly RETRY_DELAY = 30000;

  // Catégories disponibles
  private readonly CATEGORIES = [
    'Petit-déjeuner',
    'Déjeuner', 
    'Dîner',
    'Restauration rapide',
    'Boissons'
  ];

  constructor(private platService: PlatService) {
    this.initializeChatHistory();
  }

  private initializeChatHistory() {
    this.chatHistory = [
      {
        role: 'user',
        parts: [{
          text: `Tu es Maria, l'assistante virtuelle du restaurant "Restau". 

Tu es experte en gastronomie et connais parfaitement notre menu.

INFORMATIONS DU RESTAURANT :
- Nom : Restau
- Spécialités : Cuisine tunisienne, française et méditerranéenne
- Horaires : 05h-02h 

CATÉGORIES DE PLATS DISPONIBLES :
- Petit-déjeuner
- Déjeuner 
- Dîner
- Restauration rapide
- Boissons

SERVICES :
- Paiement : PayPal (en ligne) ou espèces (caisse)
- Client sur place : QR code sur table pour commander
- Client en ligne : compte pour réserver/livraison

Sois chaleureuse, professionnelle et concise ! Quand on te demande le menu ou des plats, utilise les données réelles du restaurant.`
        }]
      },
      {
        role: 'model',
        parts: [{
          text: `Bonjour ! Je suis Maria, votre assistante du restaurant "Restau" ! 👩‍🍳

Je connais parfaitement nos spécialités **tunisiennes, françaises et méditerranéennes**. Nous sommes ouverts de **5h à 2h** pour satisfaire toutes vos envies !

Comment puis-je vous aider ? Menu, réservation, livraison ? 🌟`
        }]
      }
    ];
  }

  // Récupérer tous les plats de toutes les catégories
  private async getAllPlats(): Promise<Map<string, Plat[]>> {
    const now = Date.now();
    
    // Vérifier le cache
    if (this.platsCache.size > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.platsCache;
    }

    try {
      // Récupérer les plats pour chaque catégorie
      const platsPromises = this.CATEGORIES.map(async (categorie) => {
        try {
          const plats = await this.platService.getPlatsByCategorie(categorie).toPromise();
          return { categorie, plats: plats || [] };
        } catch (error) {
          console.warn(`Erreur lors de la récupération des plats pour ${categorie}:`, error);
          return { categorie, plats: [] };
        }
      });

      const results = await Promise.all(platsPromises);
      
      // Mettre à jour le cache
      this.platsCache.clear();
      results.forEach(result => {
        if (result.plats.length > 0) {
          this.platsCache.set(result.categorie, result.plats);
        }
      });
      
      this.cacheTimestamp = now;
      return this.platsCache;
    } catch (error) {
      console.error('Erreur lors de la récupération des plats:', error);
      return this.platsCache;
    }
  }

  // Formater les plats pour l'affichage
  private formatPlatsForDisplay(platsMap: Map<string, Plat[]>): string {
    if (platsMap.size === 0) {
      return "Désolée, je ne peux pas récupérer le menu en ce moment. Veuillez réessayer plus tard.";
    }

    let menuText = "🍽️ **NOTRE MENU** 🍽️\n\n";
    
    platsMap.forEach((plats, categorie) => {
      if (plats.length > 0) {
        menuText += `📋 **${categorie.toUpperCase()}**\n`;
        
        plats.forEach(plat => {
          menuText += `• **${plat.name}** - ${plat.prix}TND`;
          if (plat.description) {
            menuText += `\n  _${plat.description}_`;
          }
          menuText += '\n';
        });
        
        menuText += '\n';
      }
    });

    return menuText;
  }

  // Rechercher des plats par mots-clés
  private async searchPlats(query: string): Promise<string> {
    const platsMap = await this.getAllPlats();
    const searchTerm = query.toLowerCase();
    const matchingPlats: { categorie: string; plat: Plat }[] = [];

    platsMap.forEach((plats, categorie) => {
      plats.forEach(plat => {
        if (plat.name.toLowerCase().includes(searchTerm) || 
            (plat.description && plat.description.toLowerCase().includes(searchTerm))) {
          matchingPlats.push({ categorie, plat });
        }
      });
    });

    if (matchingPlats.length === 0) {
      return `Je n'ai pas trouvé de plats correspondant à "${query}". Voulez-vous voir notre menu complet ?`;
    }

    let result = `🔍 **Plats trouvés pour "${query}" :**\n\n`;
    matchingPlats.forEach(({ categorie, plat }) => {
      result += `📋 **${categorie}**\n`;
      result += `• **${plat.name}** - ${plat.prix}TND`;
      if (plat.description) result += `\n  _${plat.description}_`;
      result += '\n\n';
    });

    return result;
  }

  // Obtenir les plats d'une catégorie spécifique
  private async getPlatsByCategory(categorie: string): Promise<string> {
    const platsMap = await this.getAllPlats();
    const normalizedCategory = this.CATEGORIES.find(cat => 
      cat.toLowerCase().includes(categorie.toLowerCase()) ||
      categorie.toLowerCase().includes(cat.toLowerCase())
    );

    if (!normalizedCategory) {
      return `Catégorie "${categorie}" non trouvée. Nos catégories sont : ${this.CATEGORIES.join(', ')}`;
    }

    const plats = platsMap.get(normalizedCategory);
    if (!plats || plats.length === 0) {
      return `Aucun plat disponible dans la catégorie "${normalizedCategory}" pour le moment.`;
    }

    let result = `📋 **${normalizedCategory.toUpperCase()}**\n\n`;
    plats.forEach(plat => {
      result += `• **${plat.name}** - ${plat.prix}TND`;
      if (plat.description) result += `\n  _${plat.description}_`;
      result += '\n';
    });

    return result;
  }

  private getApiUsage(): ApiUsageInfo {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const now = Date.now();
    
    if (!stored) {
      return {
        requestCount: 0,
        lastResetTime: now,
        dailyCount: 0,
        lastDailyReset: now
      };
    }

    const usage: ApiUsageInfo = JSON.parse(stored);
    
    if (now - usage.lastResetTime > 60000) {
      usage.requestCount = 0;
      usage.lastResetTime = now;
    }

    if (now - usage.lastDailyReset > 86400000) {
      usage.dailyCount = 0;
      usage.lastDailyReset = now;
    }

    return usage;
  }

  private updateApiUsage(): void {
    const usage = this.getApiUsage();
    usage.requestCount++;
    usage.dailyCount++;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
  }

  private canMakeApiCall(): { canCall: boolean; reason?: string; waitTime?: number } {
    const usage = this.getApiUsage();
    
    if (usage.dailyCount >= this.MAX_DAILY_REQUESTS) {
      return { 
        canCall: false, 
        reason: 'Limite quotidienne atteinte',
        waitTime: 86400000 - (Date.now() - usage.lastDailyReset)
      };
    }

    if (usage.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      return { 
        canCall: false, 
        reason: 'Limite par minute atteinte',
        waitTime: 60000 - (Date.now() - usage.lastResetTime)
      };
    }

    return { canCall: true };
  }

  private async findPredefinedResponse(userMessage: string): Promise<string | null> {
    const message = userMessage.toLowerCase();
    
    // Réponses statiques
    const staticResponses = new Map<string, string>([
      ['horaires', 'Nous sommes ouverts de **5h du matin à 2h du matin** tous les jours ! 🕔'],
      ['paiement', 'Nous acceptons :\n- 💳 PayPal (en ligne)\n- 💰 Espèces (à la caisse)\n\nPour les clients sur place : scannez le QR code sur votre table pour commander et payer directement !'],
      ['reservation', 'Pour réserver une table :\n1. Créez un compte sur notre site\n2. Choisissez votre créneau\n3. Confirmez votre réservation\n\nOu appelez-nous directement ! 📞'],
      ['livraison', 'Oui, nous proposons la livraison ! 🚚\n\nCommandez en ligne avec votre compte client et payez par PayPal. Temps de livraison : 30-45 minutes selon votre localisation.']
    ]);

 
    // Vérifications pour les plats (réponses dynamiques)
    if (message.includes('menu') || message.includes('carte') || message.includes('plat')) {
      const platsMap = await this.getAllPlats();
      return this.formatPlatsForDisplay(platsMap);
    }

    // Recherche par catégorie
    for (const categorie of this.CATEGORIES) {
      if (message.includes(categorie.toLowerCase()) || 
          message.includes(categorie.toLowerCase().replace('-', ' '))) {
        return await this.getPlatsByCategory(categorie);
      }
    }

    // Recherche de plats spécifiques
    if (message.includes('cherche') || message.includes('trouve') || message.includes('recherche')) {
      // Extraire le terme de recherche (simplification)
      const words = message.split(' ');
      const searchIndex = words.findIndex(w => w.includes('cherche') || w.includes('trouve') || w.includes('recherche'));
      if (searchIndex >= 0 && searchIndex < words.length - 1) {
        const searchTerm = words.slice(searchIndex + 1).join(' ');
        return await this.searchPlats(searchTerm);
      }
    }

    return null;
  }

  async sendMessage(userMessage: string): Promise<void> {
    const currentMessages = this.messagesSubject.value;
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    this.messagesSubject.next([...currentMessages, newUserMessage]);

    try {
      // Vérifier d'abord les réponses prédéfinies (incluant les plats dynamiques)
      const predefinedResponse = await this.findPredefinedResponse(userMessage);
      
      if (predefinedResponse) {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: predefinedResponse,
          timestamp: new Date()
        };

        const updatedMessages = this.messagesSubject.value;
        this.messagesSubject.next([...updatedMessages, botMessage]);
        return;
      }

      // Vérifier les quotas avant d'appeler l'API Gemini
      const quotaCheck = this.canMakeApiCall();
      
      if (!quotaCheck.canCall) {
        let waitMessage = `Désolée, j'ai atteint ma limite d'utilisation (${quotaCheck.reason}). `;
        
        if (quotaCheck.waitTime) {
          const waitMinutes = Math.ceil(quotaCheck.waitTime / 60000);
          waitMessage += `Veuillez réessayer dans ${waitMinutes} minute(s). `;
        }
        
        waitMessage += `\n\nEn attendant, voici notre menu :\n\n`;
        const platsMap = await this.getAllPlats();
        waitMessage += this.formatPlatsForDisplay(platsMap);

        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: waitMessage,
          timestamp: new Date()
        };
        
        const updatedMessages = this.messagesSubject.value;
        this.messagesSubject.next([...updatedMessages, errorMessage]);
        return;
      }

      // Préparer le contexte avec les plats actuels pour Gemini
      const platsMap = await this.getAllPlats();
      let contextMessage = userMessage;
      
      if (platsMap.size > 0) {
        contextMessage += "\n\nCONTEXTE - Plats disponibles :\n" + this.formatPlatsForDisplay(platsMap);
      }

      // Procéder à l'appel API Gemini
      this.updateApiUsage();

      const chat = this.model.startChat({
        history: this.chatHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      });

      const result = await chat.sendMessage(contextMessage);
      const response = result.response;
      const botResponse = response.text();

      // Mettre à jour l'historique
      this.chatHistory.push(
        {
          role: 'user',
          parts: [{ text: userMessage }] // Stocker le message original sans le contexte
        },
        {
          role: 'model', 
          parts: [{ text: botResponse }]
        }
      );

      const botMessage: ChatMessage = {
        role: 'assistant',
        content: botResponse,
        timestamp: new Date()
      };

      const updatedMessages = this.messagesSubject.value;
      this.messagesSubject.next([...updatedMessages, botMessage]);

    } catch (error) {
      console.error('Erreur détaillée:', error);
      
      let errorMsg = "Désolée, je rencontre un problème technique.";
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          const platsMap = await this.getAllPlats();
          errorMsg = `🚫 Quota API dépassé ! En attendant, voici notre menu :\n\n${this.formatPlatsForDisplay(platsMap)}`;
        } else if (error.message.includes('API_KEY')) {
          errorMsg = "Problème avec la clé API. Veuillez vérifier la configuration.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMsg = "Problème de connexion. Vérifiez votre internet et réessayez.";
        }
      }
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date()
      };
      
      const updatedMessages = this.messagesSubject.value;
      this.messagesSubject.next([...updatedMessages, errorMessage]);
    }
  }

  // Méthodes utilitaires
  getQuotaStatus(): { requests: number; daily: number; canCall: boolean } {
    const usage = this.getApiUsage();
    const quotaCheck = this.canMakeApiCall();
    
    return {
      requests: usage.requestCount,
      daily: usage.dailyCount,
      canCall: quotaCheck.canCall
    };
  }

  resetChat(): void {
    this.chatHistory = [];
    this.messagesSubject.next([]);
    this.initializeChatHistory();
  }

  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  resetQuotas(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Méthode pour vider le cache des plats (utile si le menu change)
  clearPlatsCache(): void {
    this.platsCache.clear();
    this.cacheTimestamp = 0;
  }
}