import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-translate-page',
  templateUrl: './translate-page.component.html',
  styleUrls: ['./translate-page.component.css']
})
export class TranslatePageComponent implements OnInit {

  ngOnInit(): void {
    this.loadGoogleTranslateScript();

  }

    loadGoogleTranslateScript(): void {
    const scriptId = 'google-translate';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);

      // Attach the initialization function to the global scope
      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: 'en' },
          'google_translate_element'
        );
      };
    }
  }

}
