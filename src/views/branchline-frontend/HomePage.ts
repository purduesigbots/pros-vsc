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
  .homepage {
    text-align: center;
    background-color: #f0f0f0;
    padding: 50px 0;
    min-height: 100vh;
  }
    
  .banner {
    padding: 70px 25px;
    background-color: #212529;
    color: white;
    position: relative;
    overflow: hidden;
    background-image: linear-gradient(120deg, #343a40 30%, #212529 90%);
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  }
  
  .banner::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(to right, #61dafb, #25c685);
    animation: shimmer 2.5s ease-in-out infinite;
  }
  
  .searchBarContainer {
    position: absolute;
    right: 25px;
    bottom: -25px; /* Half outside the banner for a modern look */
  }
  
  #searchBar {
    padding: 10px 15px;
    font-size: 1rem;
    border: none;
    border-radius: 20px;
    outline: none;
    width: 240px; /* Fixed width for the search bar */
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
  }
  
  #searchBar:focus {
    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
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
