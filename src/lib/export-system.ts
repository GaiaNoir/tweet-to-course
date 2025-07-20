import archiver from 'archiver';
import { Course } from '@/types';
import { slideGenerator, SlideTheme, slideThemes } from './slide-generator';
import { coverArtGenerator, GeneratedCoverArt } from './cover-art-generator';
import { salesPageGenerator, SalesPageContent } from './sales-page-generator';
import { marketingGenerator, MarketingAssets } from './marketing-generator';

export interface ExportOptions {
  includeSlides: boolean;
  includeCoverArt: boolean;
  includeSalesPage: boolean;
  includeMarketing: boolean;
  slideTheme: string;
  coverArtStyles: string[];
  format: 'zip' | 'individual';
}

export interface ExportPackage {
  slides?: {
    html: string;
    markdown: string;
    pdf?: Buffer;
  };
  coverArt?: GeneratedCoverArt[];
  salesPage?: {
    content: SalesPageContent;
    html: string;
    markdown: string;
  };
  marketing?: {
    assets: MarketingAssets;
    package: string;
  };
  metadata: {
    courseName: string;
    generatedAt: string;
    exportOptions: ExportOptions;
  };
}

export class ExportSystem {
  async generateCompletePackage(
    course: Course,
    options: ExportOptions
  ): Promise<ExportPackage> {
    const exportPackage: ExportPackage = {
      metadata: {
        courseName: course.title,
        generatedAt: new Date().toISOString(),
        exportOptions: options
      }
    };

    try {
      // Generate slides if requested
      if (options.includeSlides) {
        const theme = slideThemes[options.slideTheme] || slideThemes.professional;
        const slideMarkdown = slideGenerator.generateSlides(course, theme);
        const slideHTML = await slideGenerator.renderToHTML(slideMarkdown);
        
        exportPackage.slides = {
          html: slideHTML,
          markdown: slideMarkdown
        };
      }

      // Generate cover art if requested
      if (options.includeCoverArt) {
        exportPackage.coverArt = await coverArtGenerator.generateCoverArt(
          course,
          options.coverArtStyles
        );
      }

      // Generate sales page if requested
      if (options.includeSalesPage) {
        const salesPageContent = await salesPageGenerator.generateSalesPage(course);
        const salesPageHTML = salesPageGenerator.generateHTML(salesPageContent);
        const salesPageMarkdown = salesPageGenerator.generateGumroadMarkdown(salesPageContent);
        
        exportPackage.salesPage = {
          content: salesPageContent,
          html: salesPageHTML,
          markdown: salesPageMarkdown
        };
      }

      // Generate marketing assets if requested
      if (options.includeMarketing && exportPackage.salesPage) {
        const marketingAssets = await marketingGenerator.generateMarketingAssets(
          course,
          exportPackage.salesPage.content
        );
        const marketingPackage = marketingGenerator.generateMarketingPackage(marketingAssets);
        
        exportPackage.marketing = {
          assets: marketingAssets,
          package: marketingPackage
        };
      }

      return exportPackage;
    } catch (error) {
      console.error('Error generating export package:', error);
      throw new Error(`Failed to generate export package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createZipArchive(exportPackage: ExportPackage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      const chunks: Buffer[] = [];
      
      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Create folder structure
      const courseName = this.sanitizeFilename(exportPackage.metadata.courseName);
      const timestamp = new Date().toISOString().split('T')[0];
      const folderName = `${courseName}-${timestamp}`;

      // Add slides
      if (exportPackage.slides) {
        archive.append(exportPackage.slides.html, { 
          name: `${folderName}/slides/slides.html` 
        });
        archive.append(exportPackage.slides.markdown, { 
          name: `${folderName}/slides/slides.md` 
        });
        if (exportPackage.slides.pdf) {
          archive.append(exportPackage.slides.pdf, { 
            name: `${folderName}/slides/slides.pdf` 
          });
        }
      }

      // Add cover art
      if (exportPackage.coverArt) {
        exportPackage.coverArt.forEach((coverArt, index) => {
          // Note: In a real implementation, you'd download the image from the URL
          // For now, we'll just save the URL and metadata
          const coverInfo = {
            url: coverArt.url,
            style: coverArt.style,
            prompt: coverArt.prompt,
            downloadInstructions: 'Right-click the URL and save the image'
          };
          
          archive.append(JSON.stringify(coverInfo, null, 2), {
            name: `${folderName}/cover-art/cover-${coverArt.style}.json`
          });
        });
      }

      // Add sales page
      if (exportPackage.salesPage) {
        archive.append(exportPackage.salesPage.html, {
          name: `${folderName}/sales-page/sales-page.html`
        });
        archive.append(exportPackage.salesPage.markdown, {
          name: `${folderName}/sales-page/gumroad-description.md`
        });
        archive.append(JSON.stringify(exportPackage.salesPage.content, null, 2), {
          name: `${folderName}/sales-page/sales-data.json`
        });
      }

      // Add marketing assets
      if (exportPackage.marketing) {
        archive.append(exportPackage.marketing.package, {
          name: `${folderName}/marketing/marketing-assets.md`
        });
        archive.append(JSON.stringify(exportPackage.marketing.assets, null, 2), {
          name: `${folderName}/marketing/marketing-data.json`
        });
        
        // Individual marketing files
        archive.append(exportPackage.marketing.assets.tweets.join('\n\n---\n\n'), {
          name: `${folderName}/marketing/tweets.txt`
        });
        archive.append(exportPackage.marketing.assets.instagramCaptions.join('\n\n---\n\n'), {
          name: `${folderName}/marketing/instagram-captions.txt`
        });
        archive.append(exportPackage.marketing.assets.launchEmail, {
          name: `${folderName}/marketing/launch-email.txt`
        });
      }

      // Add README
      const readme = this.generateReadme(exportPackage);
      archive.append(readme, {
        name: `${folderName}/README.md`
      });

      // Add metadata
      archive.append(JSON.stringify(exportPackage.metadata, null, 2), {
        name: `${folderName}/metadata.json`
      });

      archive.finalize();
    });
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
  }

  private generateReadme(exportPackage: ExportPackage): string {
    const courseName = exportPackage.metadata.courseName;
    const generatedAt = new Date(exportPackage.metadata.generatedAt).toLocaleDateString();
    
    return `# ${courseName} - Complete Course Package

Generated on: ${generatedAt}

## What's Included

${exportPackage.slides ? '✅ **Slide Deck**\n- HTML presentation (slides/slides.html)\n- Markdown source (slides/slides.md)\n- Open slides.html in your browser to view the presentation\n' : ''}

${exportPackage.coverArt ? '✅ **Cover Art**\n- Multiple style variations in cover-art/ folder\n- Each style includes download URL and generation details\n- Right-click URLs to download high-resolution images\n' : ''}

${exportPackage.salesPage ? '✅ **Sales Page**\n- Complete HTML sales page (sales-page/sales-page.html)\n- Gumroad-ready description (sales-page/gumroad-description.md)\n- Sales data in JSON format for customization\n' : ''}

${exportPackage.marketing ? '✅ **Marketing Assets**\n- Complete marketing package (marketing/marketing-assets.md)\n- Individual files for tweets, Instagram, and email\n- Video scripts and ad headlines included\n' : ''}

## How to Use

### Slides
1. Open \`slides/slides.html\` in your web browser
2. Use arrow keys or click to navigate
3. Press 'F' for fullscreen presentation mode
4. Customize the markdown file and regenerate if needed

### Cover Art
1. Check the JSON files in cover-art/ folder for image URLs
2. Download your preferred style by visiting the URL
3. Use for course thumbnails, social media, and marketing

### Sales Page
1. Upload \`sales-page.html\` to your website or hosting platform
2. Customize colors, fonts, and content as needed
3. Use \`gumroad-description.md\` for marketplace listings
4. Update pricing and links to match your setup

### Marketing Assets
1. Copy tweets from \`marketing/tweets.txt\` for social media
2. Use Instagram captions for visual posts
3. Adapt video scripts for your content creation
4. Use email template for launch sequences

## Customization Tips

- **Colors**: Update CSS variables in HTML files to match your brand
- **Content**: Edit markdown files and regenerate HTML as needed
- **Images**: Replace placeholder images with your own branded visuals
- **Links**: Update all [link] placeholders with your actual URLs

## Support

This package was generated by AI Course Alchemist. For questions or support:
- Review the JSON data files for detailed content structure
- Modify markdown files for easy content updates
- Use the provided templates as starting points for your customizations

---

*Generated by AI Course Alchemist - Transform your threads into sellable courses*`;
  }

  getDefaultExportOptions(): ExportOptions {
    return {
      includeSlides: true,
      includeCoverArt: true,
      includeSalesPage: true,
      includeMarketing: true,
      slideTheme: 'professional',
      coverArtStyles: ['professional', 'creative', 'minimal'],
      format: 'zip'
    };
  }
}

export const exportSystem = new ExportSystem();