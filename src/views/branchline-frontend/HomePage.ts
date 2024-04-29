import * as vscode from 'vscode';
import { getHeaderHtml, getHeaderStyles } from './Header';
import { getTemplateCardHtml, getTemplateCardStyles } from './TemplateCard';

export function getHomePageHtml(templates: any[], iconUri: vscode.Uri): string {
  const templateCardsHtml = templates.map(template => getTemplateCardHtml(template)).join('');

  return `
    <div class="homepage">
      <header class="homepage-header">
        <div class="logo-container">
          <img src="${iconUri}" alt="PROS Logo" class="homepageLogo" />
          <div>
            <h1 class="homepageTitle">Branchline</h1>
            <p class="homepageSubtitle">Discover and install PROS Templates</p>
          </div>
        </div>
        <div class="search-container">
          <input type="text" id="searchBar" placeholder="Search...">
          <button class="search-btn">Search</button>
        </div>
      </header>
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
        text-align: left;
        background-color: #f0f0f0;
        padding: 50px 0;
        min-height: 100vh;
      }

      .homepage-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        background-color: #212529;
        color: #ffffff;
      }

      .logo-container {
        display: flex;
        align-items: center;
      }

      .homepageLogo {
        width: 100px;
        height: auto;
        margin-right: 15px;
      }

      .homepageTitle {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        color: #ffffff;
      }

      .homepageSubtitle {
        font-size: 16px;
        font-weight: 300;
        color: #ffffff;
        opacity: 0.9;
      }

      .search-container {
        display: flex;
        align-items: center;
        position: relative;
      }

      #searchBar {
        padding: 10px;
        font-size: 16px;
        border: 2px solid #ccc;
        border-radius: 5px;
        outline: none;
        width: 200px;
        background-color: white;
      }

      .search-btn {
        padding: 10px 20px;
        margin-left: 10px;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        background-color: #4b6cb7;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .search-btn:hover {
        background-color: #365f9c;
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
