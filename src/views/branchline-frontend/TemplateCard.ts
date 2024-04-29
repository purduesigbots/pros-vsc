// TemplateCard.ts
export function getTemplateCardHtml(template: any): string {
  return `
    <div class="templateCard" onclick="handleTemplateClick('${template.name}')">
      <div class="cog"></div>
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
        border: 1px solid #ccc;
        border-radius: 10px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }

      .templateCard:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
      }

      .cog {
        width: 60px; /* Adjust the size as needed */
        height: 60px; /* Adjust the size as needed */
        position: relative;
        background-image: radial-gradient(circle, white 0 35%, black 35% 70%, transparent 70% 100%), linear-gradient(to right, black, black);
        background-size: 70% 70%, 25% 100%;
        background-position: center;
        background-repeat: no-repeat;
        margin-bottom: 10px;
      }

      .cog::before,
      .cog::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: linear-gradient(to right, black, black);
        background-size: 25% 100%;
        background-repeat: no-repeat;
        background-position: center;
        z-index: -1;
      }

      .cog::before {
        transform: rotate(60deg);
      }

      .cog::after {
        transform: rotate(120deg);
      }

      .templateInfo {
        text-align: center;
        background-color: #f8f8f8;
        width: 100%;
        padding: 10px 0;
        border-radius: 8px;
        margin-top: 10px; /* Ensure spacing between icon and text */
      }

      .templateName {
        font-size: 1.2rem;
        font-weight: bold;
        color: #333;
        margin: 0 0 5px;
      }

      .templateTarget {
        font-size: 0.95rem;
        color: #666;
        margin: 0;
      }
    </style>
  `;
}
