// HomePage.ts
import { getHeaderHtml, getHeaderStyles } from './Header';
import { getTemplateCardHtml, getTemplateCardStyles } from './TemplateCard';

export function getHomePageHtml(templates: any[]): string {
  const templateCardsHtml = templates.map(template => getTemplateCardHtml(template)).join('');

  return `
    <div class="homepage">
      <div class="banner">
        <img src="https://example.com/Sigbots.png" alt="Branchline Logo" class="homepageLogo" />
        <h1 class="homepageTitle">PROS BRANCHLINE REGISTRY</h1>
        <p class="homepageSubtitle">Your one-stop solution for managing your projects seamlessly.</p>
      </div>
      <div class="templateContainer">
        ${templateCardsHtml}
      </div>
    </div>
  `;
}

export function getHomePageStyles(): string {
  return `
    <style>
      :root {
        --bg-color: #f5f5f5;
        --banner-bg-color: #282c34;
        --text-color: #333;
        --secondary-text-color: #adb5bd;
        --highlight-color: #e2e5e8;
        --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        --border-radius: 10px;
        --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        --interactive-hover: #61dafb;
      }
      body, html {
        margin: 0;
        padding: 0;
        font-family: var(--font-family);
        background-color: var(--bg-color);
        color: var(--text-color);
      }
      .homepage {
        text-align: center;
        background-color: var(--bg-color);
        padding: 40px 0;
      }
      .banner {
        padding: 60px 20px;
        background-color: var(--banner-bg-color);
        color: white;
        position: relative;
        overflow: hidden;
        background-image: linear-gradient(135deg, #282c34 40%, #20232a 100%);
        box-shadow: var(--box-shadow);
      }
      .banner::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: linear-gradient(to right, var(--highlight-color), var(--interactive-hover));
        animation: shimmer 3s ease-in-out infinite;
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      .homepageLogo {
        width: 120px;
        margin-bottom: 30px;
        transition: all 0.5s ease;
        animation: bounce 2s infinite;
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      .homepageLogo:hover {
        transform: rotate(-10deg) scale(1.1);
      }
      .homepageTitle, .homepageSubtitle {
        transition: color 0.3s ease, transform 0.3s ease;
      }
      .homepageTitle:hover, .homepageSubtitle:hover {
        color: var(--interactive-hover);
        transform: scale(1.05);
      }
      .homepageTitle {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .homepageSubtitle {
        font-size: 1.5rem;
        margin-bottom: 40px;
        color: var(--secondary-text-color);
      }
      .templateContainer {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 30px;
        padding: 40px;
        animation: fadeIn 1s ease-out;
      }
      .button {
        padding: 15px 30px;
        font-size: 1rem;
        background-color: var(--highlight-color);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        box-shadow: var(--box-shadow);
        text-decoration: none;
        display: inline-block;
      }
      .button:hover {
        background-color: var(--interactive-hover);
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
      }
    </style>
  `;
}