import * as vscode from 'vscode';
import { getHeaderHtml, getHeaderStyles } from './Header';
import { getTemplateCardHtml, getTemplateCardStyles } from './TemplateCard';

export function getHomePageHtml(templates: any[], iconUri: vscode.Uri): string {
  const templateCardsHtml = templates.map(template => getTemplateCardHtml(template)).join('');

  return `
    <div class="homepage">
      <div class="banner">
        <div class="banner-content">
          <img src="${iconUri}" alt="PROS Logo" class="homepageLogo" />
          <h1 class="homepageTitle">Branchline</h1>
          <p class="homepageSubtitle">Discover and install PROS Templates</p>
        </div>
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
      .homepage {
        text-align: center;
        background-color: #f0f0f0;
        padding: 50px 0;
        min-height: 100vh;
      }

      .banner {
        background-color: #212529;
        padding: 60px 20px;
        position: relative;
        overflow: hidden;
      }

      .banner-content {
        position: relative;
        z-index: 1;
      }

      .banner::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #4b6cb7, #212529);
        opacity: 0.8;
        z-index: 0;
      }

      .homepageLogo {
        width: 120px;
        height: auto;
        margin-bottom: 30px;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
      }

      .homepageTitle {
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 4px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }

      .homepageSubtitle {
        font-size: 24px;
        font-weight: 300;
        color: #ffffff;
        opacity: 0.9;
      }

      .searchBarContainer {
        position: absolute;
        right: 25px;
        bottom: -25px;
      }

      #searchBar {
        padding: 10px 15px;
        font-size: 1rem;
        border: none;
        border-radius: 20px;
        outline: none;
        width: 240px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
      }

      #searchBar:focus {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
      }

      .templateContainer {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        padding: 20px;
        animation: fadeIn 1s ease-out;
      }
    </style>
  `;
}