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
      .templateCard {
        background-color: #fff;
        border: 1px solid #ccc; /* Added a subtle border */
        border-radius: 10px; /* Smoothed border radius */
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }

      .templateCard:hover {
        transform: scale(1.03);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
      }

      .templateLogo {
        width: 100px; /* Increased size for better visibility */
        height: auto;
        margin-bottom: 10px;
      }

      .templateInfo {
        text-align: center;
        background-color: #f8f8f8; /* Light grey background for the text area */
        width: 100%; /* Full width of the card */
        padding: 8px 0; /* Padding around text */
        border-radius: 8px; /* Rounded corners inside the card */
      }

      .templateName {
        font-size: 1.1rem; /* Slightly larger font size */
        font-weight: bold;
        color: #333; /* Darker color for better contrast */
        margin: 0 0 5px; /* Adjusted margins */
      }

      .templateTarget {
        font-size: 0.9rem;
        color: #666;
        margin: 0; /* Reduced top margin for tighter design */
      }
    </style>
  `;
}
