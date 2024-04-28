// Header.ts
export function getHeaderHtml(): string {
  return `
    <header class="header">
      <img src="https://example.com/Sigbots.png" alt="Branchline Logo" class="headerLogo" />
      <h1 class="headerTitle"></h1>
    </header>
  `;
}

export function getHeaderStyles(): string {
  return `
    <style>
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: #282c34;
        background-image: linear-gradient(to right, #20232a, #282c34);
        padding: 20px;
        color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        border-bottom: 2px solid #61dafb;
      }
      .headerLogo {
        width: 100px;
        margin-right: 20px;
        transition: transform 0.3s ease;
      }
      .headerLogo:hover {
        transform: scale(1.05);
        cursor: pointer;
      }
      .headerTitle {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        flex: 1;
        letter-spacing: 0.05rem;
        transition: color 0.3s ease;
      }
      .headerTitle:hover {
        color: #61dafb;
        cursor: pointer;
      }
    </style>
  `;
}