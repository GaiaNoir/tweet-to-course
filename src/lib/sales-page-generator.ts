import { claude } from './claude';
import { Course } from '@/types';

export interface SalesPageContent {
  courseName: string;
  headline: string;
  subheadline: string;
  painPoints: string[];
  learningObjectives: string[];
  benefits: string[];
  pricingTiers: PricingTier[];
  testimonialPlaceholders: string[];
  callToAction: string;
  urgencyText: string;
  guaranteeText: string;
}

export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export class SalesPageGenerator {
  async generateSalesPage(course: Course): Promise<SalesPageContent> {
    try {
      const prompt = this.buildSalesPagePrompt(course);
      
      const response = await claude.messages.create({
        model: "claude-3-5-sonnet-20241022", // Latest Claude 3.5 Sonnet model
        max_tokens: 2000,
        temperature: 0.8,
        system: `You are an expert copywriter specializing in course sales pages. 
            Create compelling, benefit-focused copy that converts visitors into customers.
            Focus on transformation, results, and addressing pain points.
            Return your response as a valid JSON object with the exact structure requested.`,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      if (!content) {
        throw new Error('No response from Claude');
      }

      // Parse the JSON response
      const salesPageData = JSON.parse(content) as SalesPageContent;
      
      // Ensure we have all required fields with defaults
      return {
        courseName: salesPageData.courseName || course.title,
        headline: salesPageData.headline || `Master ${course.title} in Record Time`,
        subheadline: salesPageData.subheadline || 'Transform your knowledge into actionable results',
        painPoints: salesPageData.painPoints || this.generateDefaultPainPoints(course),
        learningObjectives: salesPageData.learningObjectives || this.generateDefaultObjectives(course),
        benefits: salesPageData.benefits || this.generateDefaultBenefits(course),
        pricingTiers: salesPageData.pricingTiers || this.generateDefaultPricing(),
        testimonialPlaceholders: salesPageData.testimonialPlaceholders || this.generateTestimonialPlaceholders(),
        callToAction: salesPageData.callToAction || 'Get Instant Access Now',
        urgencyText: salesPageData.urgencyText || 'Limited time offer - Join today!',
        guaranteeText: salesPageData.guaranteeText || '30-day money-back guarantee'
      };
    } catch (error) {
      console.error('Error generating sales page:', error);
      // Return default content if AI generation fails
      return this.generateDefaultSalesPage(course);
    }
  }

  private buildSalesPagePrompt(course: Course): string {
    const modulesList = course.modules.map(m => `- ${m.title}: ${m.summary}`).join('\n');
    const allTakeaways = course.modules.flatMap(m => m.takeaways).join(', ');

    return `Create a high-converting sales page for this course:

Course Title: ${course.title}

Modules:
${modulesList}

Key Takeaways: ${allTakeaways}

Generate a JSON response with this exact structure:
{
  "courseName": "Catchy course name (can be different from original title)",
  "headline": "Compelling headline that promises transformation",
  "subheadline": "Supporting subheadline that adds context",
  "painPoints": ["3-5 pain points this course solves"],
  "learningObjectives": ["5-7 specific things students will learn"],
  "benefits": ["5-7 benefits/outcomes students will achieve"],
  "pricingTiers": [
    {
      "name": "Basic",
      "price": 47,
      "description": "Essential course content",
      "features": ["Course modules", "PDF downloads", "Email support"]
    },
    {
      "name": "Pro",
      "price": 97,
      "description": "Everything in Basic plus bonuses",
      "features": ["Everything in Basic", "Bonus materials", "1-on-1 consultation", "Private community access"],
      "recommended": true
    },
    {
      "name": "VIP",
      "price": 197,
      "description": "Complete transformation package",
      "features": ["Everything in Pro", "Personal coaching session", "Implementation templates", "Lifetime updates"]
    }
  ],
  "testimonialPlaceholders": ["3 testimonial placeholders with realistic quotes"],
  "callToAction": "Action-oriented CTA button text",
  "urgencyText": "Urgency/scarcity message",
  "guaranteeText": "Risk reversal guarantee text"
}

Make the copy benefit-focused, addressing real pain points, and emphasizing transformation and results.`;
  }

  private generateDefaultSalesPage(course: Course): SalesPageContent {
    return {
      courseName: course.title,
      headline: `Master ${course.title} and Transform Your Results`,
      subheadline: 'Learn proven strategies that actually work in the real world',
      painPoints: this.generateDefaultPainPoints(course),
      learningObjectives: this.generateDefaultObjectives(course),
      benefits: this.generateDefaultBenefits(course),
      pricingTiers: this.generateDefaultPricing(),
      testimonialPlaceholders: this.generateTestimonialPlaceholders(),
      callToAction: 'Get Instant Access Now',
      urgencyText: 'Limited time offer - Join hundreds of successful students!',
      guaranteeText: '30-day money-back guarantee - Risk free!'
    };
  }

  private generateDefaultPainPoints(course: Course): string[] {
    return [
      'Struggling to implement what you learn from scattered information',
      'Wasting time on strategies that don\'t actually work',
      'Feeling overwhelmed by too much theory and not enough action',
      'Missing the key insights that make the difference between success and failure'
    ];
  }

  private generateDefaultObjectives(course: Course): string[] {
    return course.modules.map(module => 
      `How to ${module.title.toLowerCase().replace(/^(how to|learn|master|understand)\s*/i, '')}`
    );
  }

  private generateDefaultBenefits(course: Course): string[] {
    return [
      'Save hours of trial and error with proven strategies',
      'Get clear, actionable steps you can implement immediately',
      'Avoid common mistakes that cost time and money',
      'Join a community of like-minded achievers',
      'Access expert insights not available anywhere else'
    ];
  }

  private generateDefaultPricing(): PricingTier[] {
    return [
      {
        name: 'Essential',
        price: 47,
        description: 'Perfect for getting started',
        features: [
          'Complete course modules',
          'PDF downloads',
          'Email support',
          'Lifetime access'
        ]
      },
      {
        name: 'Pro',
        price: 97,
        description: 'Most popular choice',
        features: [
          'Everything in Essential',
          'Bonus implementation guide',
          'Private community access',
          'Monthly Q&A sessions',
          'Priority support'
        ],
        recommended: true
      },
      {
        name: 'VIP',
        price: 197,
        description: 'Complete transformation',
        features: [
          'Everything in Pro',
          '1-on-1 strategy session',
          'Custom implementation plan',
          'Direct access to instructor',
          'Lifetime updates'
        ]
      }
    ];
  }

  private generateTestimonialPlaceholders(): string[] {
    return [
      '"This course completely changed how I approach [topic]. The results were immediate and impressive!" - Sarah M., Entrepreneur',
      '"Finally, a course that delivers on its promises. Clear, actionable, and incredibly valuable." - Mike R., Consultant',
      '"I wish I had found this course years ago. It would have saved me so much time and frustration." - Jennifer L., Business Owner'
    ];
  }

  generateHTML(salesPage: SalesPageContent): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${salesPage.courseName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .hero { text-align: center; padding: 60px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .hero h1 { font-size: 3rem; margin-bottom: 20px; font-weight: bold; }
        .hero p { font-size: 1.3rem; opacity: 0.9; }
        .section { padding: 60px 0; }
        .section h2 { font-size: 2.5rem; margin-bottom: 30px; text-align: center; color: #2c3e50; }
        .pain-points { background: #f8f9fa; }
        .pain-points ul { list-style: none; max-width: 600px; margin: 0 auto; }
        .pain-points li { padding: 15px; margin: 10px 0; background: white; border-left: 4px solid #e74c3c; border-radius: 5px; }
        .benefits ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; list-style: none; }
        .benefits li { padding: 20px; background: #e8f5e8; border-radius: 10px; border-left: 4px solid #27ae60; }
        .pricing { background: #f8f9fa; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-top: 40px; }
        .pricing-card { background: white; padding: 30px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative; }
        .pricing-card.recommended { border: 3px solid #3498db; transform: scale(1.05); }
        .pricing-card.recommended::before { content: 'MOST POPULAR'; position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #3498db; color: white; padding: 5px 20px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
        .price { font-size: 3rem; color: #2c3e50; font-weight: bold; margin: 20px 0; }
        .features { list-style: none; text-align: left; margin: 20px 0; }
        .features li { padding: 8px 0; border-bottom: 1px solid #eee; }
        .features li:before { content: '✓'; color: #27ae60; font-weight: bold; margin-right: 10px; }
        .cta-button { display: inline-block; background: #e74c3c; color: white; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 1.2rem; margin: 20px 0; transition: all 0.3s; }
        .cta-button:hover { background: #c0392b; transform: translateY(-2px); }
        .testimonials { background: #2c3e50; color: white; }
        .testimonial { background: rgba(255,255,255,0.1); padding: 30px; margin: 20px 0; border-radius: 10px; font-style: italic; }
        .guarantee { text-align: center; padding: 40px; background: #d5f4e6; border-radius: 15px; margin: 40px 0; }
        .guarantee h3 { color: #27ae60; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            <h1>${salesPage.headline}</h1>
            <p>${salesPage.subheadline}</p>
        </div>
    </div>

    <div class="section pain-points">
        <div class="container">
            <h2>Are You Struggling With...</h2>
            <ul>
                ${salesPage.painPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </div>
    </div>

    <div class="section benefits">
        <div class="container">
            <h2>What You'll Achieve</h2>
            <ul>
                ${salesPage.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
        </div>
    </div>

    <div class="section pricing">
        <div class="container">
            <h2>Choose Your Path</h2>
            <div class="pricing-grid">
                ${salesPage.pricingTiers.map(tier => `
                    <div class="pricing-card ${tier.recommended ? 'recommended' : ''}">
                        <h3>${tier.name}</h3>
                        <div class="price">$${tier.price}</div>
                        <p>${tier.description}</p>
                        <ul class="features">
                            ${tier.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                        <a href="#" class="cta-button">${salesPage.callToAction}</a>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="section testimonials">
        <div class="container">
            <h2>What Students Are Saying</h2>
            ${salesPage.testimonialPlaceholders.map(testimonial => `
                <div class="testimonial">${testimonial}</div>
            `).join('')}
        </div>
    </div>

    <div class="container">
        <div class="guarantee">
            <h3>Risk-Free Guarantee</h3>
            <p>${salesPage.guaranteeText}</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateGumroadMarkdown(salesPage: SalesPageContent): string {
    return `# ${salesPage.courseName}

## ${salesPage.headline}

${salesPage.subheadline}

---

## Are You Struggling With...

${salesPage.painPoints.map(point => `- ${point}`).join('\n')}

---

## What You'll Learn

${salesPage.learningObjectives.map(objective => `- ${objective}`).join('\n')}

---

## What You'll Achieve

${salesPage.benefits.map(benefit => `- ${benefit}`).join('\n')}

---

## Pricing Options

${salesPage.pricingTiers.map(tier => `
### ${tier.name} - $${tier.price}
${tier.description}

${tier.features.map(feature => `- ${feature}`).join('\n')}
${tier.recommended ? '\n**MOST POPULAR CHOICE**' : ''}
`).join('\n')}

---

## Student Testimonials

${salesPage.testimonialPlaceholders.map(testimonial => `> ${testimonial}`).join('\n\n')}

---

## ${salesPage.guaranteeText}

${salesPage.urgencyText}

**${salesPage.callToAction}**`;
  }
}

export const salesPageGenerator = new SalesPageGenerator();