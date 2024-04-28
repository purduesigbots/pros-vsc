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
      <h2>${templateName}</h2>
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
        background-color: #ffffff;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        max-width: 800px;
        margin: 40px auto;
        text-align: left;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }

      .templateDetail h2 {
        color: #004085;
        margin-bottom: 20px;
        font-size: 2.25rem;
      }

      .templateDetail select {
        padding: 12px 15px;
        margin-bottom: 25px;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #ced4da;
        border-radius: 5px;
        background-color: #f8f9fa;
        font-size: 1rem;
      }

      .templateDetail a {
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        text-decoration: none;
        margin-top: 15px;
        font-weight: bold;
        transition: background-color 0.2s ease-in-out;
      }

      .templateDetail a:hover,
      .templateDetail a:focus {
        background-color: #0056b3;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .description {
        margin-top: 30px;
        line-height: 1.6;
        color: #495057;
      }

      .description h1,
      .description h2,
      .description h3,
      .description h4,
      .description h5,
      .description h6 {
        color: #004085;
        margin-top: 20px;
        margin-bottom: 10px;
      }

      .description p {
        margin-bottom: 1.25em;
      }

      .description ul,
      .description ol {
        padding-left: 40px;
        margin-bottom: 1.25em;
      }

      .description a {
        color: #0056b3;
        text-decoration: none;
        border-bottom: 1px dashed #0056b3;
        transition: border-bottom-color 0.2s ease-in-out;
      }

      .description a:hover,
      .description a:focus {
        border-bottom-color: transparent;
      }

      .backButton {
        background-color: #6c757d;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        margin-bottom: 20px;
      }

      .backButton:hover {
        background-color: #5a6268;
      }
    </style>
  `;
}