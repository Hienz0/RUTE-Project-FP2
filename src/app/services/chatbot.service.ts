import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  constructor() {}

  loadScript(): void {
    const script = document.createElement('script');
    script.id = 'chatling-embed-script';
    script.src = 'https://chatling.ai/js/embed.js';
    script.async = true;
    script.onload = () => {
      // No more TypeScript errors
      (window as any)['chtlConfig'] = {
        chatbotId: '4482333918',
        display: 'page_inline',
      };
      
    };
    document.body.appendChild(script);
  }
}
