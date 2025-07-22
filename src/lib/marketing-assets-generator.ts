import OpenAI from 'openai';

export interface MarketingAssets {
  coldDMs: string[];
  adCopyTemplate: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
  spreadsheetTemplate: {
    headers: string[];
    sampleData: string[][];
    description: string;
  };
  bonusResource: {
    type: 'checklist' | 'cheat-sheet' | 'playbook';
    title: string;
    content: string[];
  };
}

export async function generateMarketingAssets(
  courseTitle: string,
  courseContent: string,
  originalTweet: string,
  targetAudience?: string
): Promise<MarketingAssets> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const prompt = `
You are a professional marketing copywriter and growth strategist. Based on the following course content, create comprehensive marketing assets that are professional, persuasive, and conversion-focused.

COURSE TITLE: ${courseTitle}

ORIGINAL TWEET: ${originalTweet}

COURSE CONTENT: ${courseContent}

TARGET AUDIENCE: ${targetAudience || 'Entrepreneurs and business professionals'}

Create the following marketing assets:

1. COLD DMs/OUTREACH MESSAGES (4-5 samples):
- Create personalized, non-salesy cold DM templates
- Focus on value proposition and curiosity
- Include different angles (pain point, success story, social proof, etc.)
- Keep each under 150 words
- Make them feel personal, not automated

2. AD COPY TEMPLATES:
Create fill-in-the-blank ad copy for:
- Facebook/Meta ads (include headline, primary text, and CTA)
- Twitter/X promoted posts
- Instagram story/feed ads
- Include placeholders like [YOUR_RESULT], [TIMEFRAME], etc.

3. SPREADSHEET TEMPLATE:
Create a marketing budget/tracking spreadsheet structure with:
- Column headers for tracking marketing performance
- 3-5 sample rows of realistic data
- Include metrics like: traffic sources, ad spend, conversion rates, ROI, etc.
- Brief description of how to use it

4. BONUS RESOURCE:
Choose the most appropriate format (checklist, cheat sheet, or mini playbook) and create:
- 8-12 actionable items
- Quick reference format
- Focused on fast execution
- Directly related to the course topic

Make everything professional, actionable, and conversion-focused. Use persuasive copywriting techniques but avoid being overly salesy.

Return the response in this exact JSON format:
{
  "coldDMs": ["dm1", "dm2", "dm3", "dm4", "dm5"],
  "adCopyTemplate": {
    "facebook": "facebook ad template with placeholders",
    "twitter": "twitter ad template with placeholders", 
    "instagram": "instagram ad template with placeholders"
  },
  "spreadsheetTemplate": {
    "headers": ["column1", "column2", "etc"],
    "sampleData": [["row1col1", "row1col2"], ["row2col1", "row2col2"]],
    "description": "how to use this spreadsheet"
  },
  "bonusResource": {
    "type": "checklist|cheat-sheet|playbook",
    "title": "resource title",
    "content": ["item1", "item2", "etc"]
  }
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional marketing copywriter and growth strategist. Always return valid JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const marketingAssets = JSON.parse(content) as MarketingAssets;
    
    // Validate the response structure
    if (!marketingAssets.coldDMs || !marketingAssets.adCopyTemplate || 
        !marketingAssets.spreadsheetTemplate || !marketingAssets.bonusResource) {
      throw new Error('Invalid marketing assets structure');
    }

    return marketingAssets;
  } catch (error) {
    console.error('Error generating marketing assets:', error);
    throw new Error('Failed to generate marketing assets');
  }
}

export function formatMarketingAssetsForDownload(assets: MarketingAssets, courseTitle: string): string {
  return `# Marketing Assets for "${courseTitle}"

## 🔥 Cold DMs & Outreach Messages

${assets.coldDMs.map((dm, index) => `### Message ${index + 1}
${dm}

---`).join('\n\n')}

## 📱 Ad Copy Templates

### Facebook/Meta Ads
${assets.adCopyTemplate.facebook}

### Twitter/X Promoted Posts  
${assets.adCopyTemplate.twitter}

### Instagram Ads
${assets.adCopyTemplate.instagram}

## 📊 Marketing Tracking Spreadsheet

**Description:** ${assets.spreadsheetTemplate.description}

**Headers:** ${assets.spreadsheetTemplate.headers.join(' | ')}

**Sample Data:**
${assets.spreadsheetTemplate.sampleData.map(row => row.join(' | ')).join('\n')}

## 🎯 Bonus Resource: ${assets.bonusResource.title}

**Type:** ${assets.bonusResource.type.charAt(0).toUpperCase() + assets.bonusResource.type.slice(1)}

${assets.bonusResource.content.map((item, index) => `${index + 1}. ${item}`).join('\n')}

---

*Generated by Tweet to Course - Professional Marketing Assets Generator*
`;
}