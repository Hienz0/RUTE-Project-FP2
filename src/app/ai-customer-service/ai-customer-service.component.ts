import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-ai-customer-service',
  templateUrl: './ai-customer-service.component.html',
  styleUrls: ['./ai-customer-service.component.css']
})
export class AiCustomerServiceComponent implements OnInit{

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
        // Add the first script
        const chtlConfigScript = this.renderer.createElement('script');
        chtlConfigScript.type = 'text/javascript';
        chtlConfigScript.text = `
          window.chtlConfig = {
            chatbotId: "4482333918"
          };
        `;
        this.renderer.appendChild(document.body, chtlConfigScript);
    
        // Add the second script
        const chatlingScript = this.renderer.createElement('script');
        chatlingScript.src = 'https://chatling.ai/js/embed.js';
        chatlingScript.async = true;
        chatlingScript.type = 'text/javascript';
        chatlingScript.id = 'chatling-embed-script';
        chatlingScript.dataset.id = '4482333918';
        this.renderer.appendChild(document.body, chatlingScript);
  }

}
