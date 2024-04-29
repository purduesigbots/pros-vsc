export function getHeaderHtml(): string {
  return `
    <header class="header">
      <span class="notification">Important Updates - New Features Available</span>
    </header>
  `;
}

export function getHeaderStyles(): string {
  return `
    <style>
      .header {
        display: flex;
        align-items: center;
        justify-content: center; /* Aligns content to the center */
        background-color: #20232a;
        background-image: linear-gradient(to right, #343a40, #20232a);
        padding: 5px 20px; /* Reduced padding for a thinner header */
        color: white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); /* Slightly less depth to match thinner style */
        border-bottom: 2px solid #61dafb; /* Thinner border */
      }
      
      .notification {
        padding: 8px 10px; /* Slightly smaller padding */
        background-color: #4caf50;
        color: white;
        font-size: 0.95rem;
        border-radius: 20px;
        margin: 0; /* Removed extra margin */
      }
    </style>
  `;
}

