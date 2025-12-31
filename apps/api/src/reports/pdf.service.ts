import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly outputDir: string;

  constructor(private configService: ConfigService) {
    // Use local storage for now, can be changed to S3/OSS later
    this.outputDir = this.configService.get<string>('PDF_OUTPUT_DIR') || './storage/pdfs';
    this.ensureOutputDir();
  }

  private async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error: any) {
      this.logger.error(`Failed to create output directory: ${error.message}`);
    }
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePdfFromHtml(html: string, filename: string): Promise<string> {
    let browser;
    try {
      let executablePath: string | undefined = undefined;
      // Fallback for macOS system Chrome
      if (process.platform === 'darwin') {
         const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
         try {
             await fs.access(systemChrome);
             executablePath = systemChrome;
             this.logger.log(`Using system Chrome at ${executablePath}`);
         } catch (e) {}
      }

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const filePath = path.join(this.outputDir, `${filename}.pdf`);
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await browser.close();
      this.logger.log(`PDF generated: ${filePath}`);

      return filePath;
    } catch (error: any) {
      if (browser) {
        await browser.close();
      }
      this.logger.error(`Failed to generate PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate PDF from evaluation report data
   */
  async generateReportPdf(reportData: {
    assetName: string;
    templateName: string;
    overallScore?: number;
    scores?: Record<string, number>;
    rationales?: Record<string, string>;
    findings?: string[];
    risks?: string[];
    suggestions?: string[];
    reportMarkdown?: string;
    generatedAt: Date;
  }): Promise<string> {
    const html = this.buildReportHtml(reportData);
    const filename = `report-${Date.now()}-${reportData.assetName.replace(/[^a-z0-9]/gi, '_')}`;
    return this.generatePdfFromHtml(html, filename);
  }

  /**
   * Build HTML template for report
   */
  private buildReportHtml(data: {
    assetName: string;
    templateName: string;
    overallScore?: number;
    scores?: Record<string, number>;
    rationales?: Record<string, string>;
    findings?: string[];
    risks?: string[];
    suggestions?: string[];
    reportMarkdown?: string;
    generatedAt: Date;
  }): string {
    const scoresHtml = data.scores
      ? Object.entries(data.scores)
          .map(
            ([key, score]) => `
        <tr>
          <td><strong>${key}</strong></td>
          <td>${score}/100</td>
          <td>${data.rationales?.[key] || 'N/A'}</td>
        </tr>
      `,
          )
          .join('')
      : '';

    const findingsHtml = data.findings
      ? data.findings.map((f) => `<li>${f}</li>`).join('')
      : '';

    const risksHtml = data.risks ? data.risks.map((r) => `<li>${r}</li>`).join('') : '';

    const suggestionsHtml = data.suggestions
      ? data.suggestions.map((s, i) => `<li>${i + 1}. ${s}</li>`).join('')
      : '';

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>评估报告: ${data.assetName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e293b;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .meta {
      color: #64748b;
      font-size: 14px;
    }
    .score-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }
    .score-section .overall-score {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    .score-section .label {
      font-size: 16px;
      opacity: 0.9;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #1e293b;
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table th,
    table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    table tr:hover {
      background-color: #f8fafc;
    }
    ul {
      list-style-position: inside;
      padding-left: 0;
    }
    ul li {
      margin-bottom: 8px;
      padding-left: 10px;
    }
    .findings ul {
      list-style-type: disc;
    }
    .risks ul {
      list-style-type: circle;
      color: #dc2626;
    }
    .suggestions ul {
      list-style-type: decimal;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .markdown-content {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #4f46e5;
    }
    .markdown-content h3 {
      margin-top: 20px;
      margin-bottom: 10px;
      color: #1e293b;
    }
    .markdown-content p {
      margin-bottom: 10px;
    }
    @media print {
      body {
        padding: 0;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>资产评估报告</h1>
    <div class="meta">
      <strong>资产名称:</strong> ${data.assetName} | 
      <strong>评估模板:</strong> ${data.templateName} | 
      <strong>生成时间:</strong> ${data.generatedAt.toLocaleString('zh-CN')}
    </div>
  </div>

  ${data.overallScore !== undefined ? `
  <div class="score-section">
    <div class="label">总体评分</div>
    <div class="overall-score">${data.overallScore}/100</div>
  </div>
  ` : ''}

  ${scoresHtml ? `
  <div class="section">
    <h2>维度评分详情</h2>
    <table>
      <thead>
        <tr>
          <th>维度</th>
          <th>分数</th>
          <th>评分理由</th>
        </tr>
      </thead>
      <tbody>
        ${scoresHtml}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${findingsHtml ? `
  <div class="section findings">
    <h2>关键发现</h2>
    <ul>
      ${findingsHtml}
    </ul>
  </div>
  ` : ''}

  ${risksHtml ? `
  <div class="section risks">
    <h2>潜在风险</h2>
    <ul>
      ${risksHtml}
    </ul>
  </div>
  ` : ''}

  ${suggestionsHtml ? `
  <div class="section suggestions">
    <h2>改进建议</h2>
    <ul>
      ${suggestionsHtml}
    </ul>
  </div>
  ` : ''}

  ${data.reportMarkdown ? `
  <div class="section">
    <h2>详细分析</h2>
    <div class="markdown-content">
      ${this.markdownToHtml(data.reportMarkdown)}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>本报告由 Asset Rating Platform 自动生成</p>
    <p>报告生成时间: ${data.generatedAt.toLocaleString('zh-CN')}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Convert markdown to HTML (simple implementation)
   */
  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h5>$1</h5>')
      .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Get PDF file path
   */
  async getPdfPath(filename: string): Promise<string | null> {
    const filePath = path.join(this.outputDir, `${filename}.pdf`);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      return null;
    }
  }

  /**
   * Delete PDF file
   */
  async deletePdf(filename: string): Promise<void> {
    const filePath = path.join(this.outputDir, `${filename}.pdf`);
    try {
      await fs.unlink(filePath);
      this.logger.log(`PDF deleted: ${filePath}`);
    } catch (error: any) {
      this.logger.warn(`Failed to delete PDF: ${error.message}`);
    }
  }
}


