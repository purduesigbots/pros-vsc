// TemplateCard.ts
export function getTemplateCardHtml(template: any): string {
  return `
    <div class="templateCard" onclick="handleTemplateClick('${template.name}')">
      <img src="https://example.com/Sigbots.png" alt="${template.name} Logo" class="templateLogo" />
      <div class="templateInfo">
        <h3 class="templateName">${template.name}</h3>
        <p class="templateTarget">Target: ${template.target}</p>
      </div>
    </div>
  `;
}

export function getTemplateCardStyles(): string {
  return `
    <style>
    /* Container to hold cards with Flexbox for responsive layout */
    .cardContainer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around; /* Ensures cards are evenly spaced */
      align-items: flex-start; /* Aligns cards at the start */
      gap: 20px; /* Space between cards */
      padding: 20px; /* Padding around the entire container */
    }
    
    /* Style for individual cards */
    .templateCard {
      display: block;
      border: 2px solid #ccc;
      padding: 25px;
      width: calc(100% - 50px); /* Adjusts width considering padding */
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.12);
      text-decoration: none;
      background-color: #ffffff;
      border-radius: 12px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      color: #333;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .templateCard:hover {
      transform: translateY(-8px) rotate(-2deg); /* Lift and slight rotation */
      box-shadow: 0 15px 24px rgba(0, 0, 0, 0.18);
      border-color: #aaa;
    }
    
    /* Style for logos inside the cards */
    .templateLogo {
      width: 100px;
      height: auto;
      display: block;
      margin: 0 auto 20px;
      border-radius: 5px;
      transition: transform 0.3s ease; /* Smooth transition for hover effect */
    }
    
    .templateCard:hover .templateLogo {
      transform: scale(1.1); /* Logo grows slightly on card hover */
    }
    
    /* Container for textual information, styled for emphasis */
    .templateInfo {
      text-align: center;
      padding: 15px;
      background-color: #f9f9f9; /* Slightly off-white for contrast */
      border-radius: 8px;
      margin-bottom: 20px;
      animation: fadeIn 1s ease-out; /* Fade-in animation */
    }
    
    /* Keyframes for fadeIn animation */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Style for the template name */
    .templateName {
      color: #382c03;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 10px 0;
    }
    
    /* Style for target information, with italic for differentiation */
    .templateTarget {
      color: #370303;
      font-size: 1.1rem;
      margin: 10px 0;
      font-style: italic;
    }
    
    /* Example button style for actions within the card */
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #f2f2f2;
      color: #333;
      text-align: center;
      border-radius: 5px;
      text-decoration: none;
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    
    .button:hover {
      background-color: #370303; /* Change on hover for visual feedback */
      color: #ffffff;
    }
    
      }
    </style>
  `;
}