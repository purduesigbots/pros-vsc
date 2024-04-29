import * as showdown from 'showdown';

export function getTemplateDetailHtml(templateName: string, versions: any[], selectedVersion: string, description: string): string {
  let versionOptions = '';
  if (versions.length > 0) {
    versionOptions = versions.map(v => `<option value="${v.version}">${v.version}</option>`).join('');
  } else {
    versionOptions = '<option value="" disabled>No versions available</option>';
  }

  const selectedVersionData = versions.find(v => v.version === selectedVersion);
  const downloadLink = selectedVersionData && selectedVersionData.metadata && selectedVersionData.metadata.location
    ? `<a href="${selectedVersionData.metadata.location}" download class="downloadButton">Download</a>`
    : '';

  // Create a new Showdown converter instance
  const converter = new showdown.Converter();

  // Convert the Markdown description to HTML
  const htmlDescription = converter.makeHtml(description);

  // Dummy text for when template data is not available
  const dummyText = 'Sorry, no template data available.<br>'.repeat(5);

  return `
    <div class="templateDetail">
      <button class="backButton" onclick="handleBackButtonClick()">Back</button>
      <div class="cog-icon"></div>
      <h2 class="templateName">${templateName}</h2>
      <select class="versionSelect" onchange="handleVersionChange(this.value)">
        ${versionOptions}
      </select>
      ${downloadLink}
      <div class="description">${htmlDescription || dummyText}</div>
    </div>
  `;
}


export function getTemplateDetailStyles(): string {
  return `
    <style>
      .templateDetail {
        background-color: #f9f9f9;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        width: auto;
        margin: 0 auto;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

 

      .templateName {
        font-size: 2rem;
        color: #333; /* Dark color for the template name */
        margin-bottom: 15px;
        text-align: center;
      }

      .versionSelect {
        width: 200px;
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 0.9rem;
        margin-bottom: 20px;
      }

      .downloadButton {
        background-color: #4caf50;
        color: white;
        padding: 10px 18px;
        border-radius: 5px;
        text-decoration: none;
        display: block;
        font-weight: bold;
        margin-top: 10px;
      }

      .description {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 5px;
        line-height: 1.5;
        color: #555;
        font-size: 0.95rem;
        margin-top: 20px;
        width: 100%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .backButton {
        background-color: #61dafb;
        color: white;
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.8rem;
        position: absolute;
        top: 20px;
        left: 20px;
        border: none;
      }
    </style>
  `;
}
