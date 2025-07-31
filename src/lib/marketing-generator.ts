import { claude } from './claude';
import { Course } from '@/types';
import { SalesPageContent } from './sales-page-generator';

export interface MarketingAssets {
  tweets: string[];
  instagramCaptions: string[];
  videoScripts: VideoScript[];
  adHeadlines: string[];
  emailSubjects: string[];
  launchEmail: string;
}

export interface VideoScript {
  duration: string;
  type: 'talking-head' | 'animation';
  script: string;
  hooks: string[];
  callToAction: string;
}

export class MarketingGenerator {
  async generateMarketingAssets(
    course: Course, 
    salesPage: SalesPageContent
  ): Promise<MarketingAssets> {
    try {
      const prompt = this.buildMarketingPrompt(course, salesPage);
      
      const response = await claude.messages.create({
        model: "claude-3-5-sonnet-20241022", // Latest Claude 3.5 Sonnet model
        max_tokens: 3000,
        temperature: 0.8,
        system: `You are an expert marketing copywriter specializing in course launches.
            Create engaging, conversion-focused marketing copy across multiple channels.
            Focus on benefits, social proof, and compelling calls-to-action.
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

      const marketingData = JSON.parse(content) as MarketingAssets;
      
      // Ensure we have all required fields with defaults
      return {
        tweets: marketingData.tweets || this.generateDefaultTweets(course, salesPage),
        instagramCaptions: marketingData.instagramCaptions || this.generateDefaultInstagramCaptions(course, salesPage),
        videoScripts: marketingData.videoScripts || this.generateDefaultVideoScripts(course, salesPage),
        adHeadlines: marketingData.adHeadlines || this.generateDefaultAdHeadlines(course, salesPage),
        emailSubjects: marketingData.emailSubjects || this.generateDefaultEmailSubjects(course, salesPage),
        launchEmail: marketingData.launchEmail || this.generateDefaultLaunchEmail(course, salesPage)
      };
    } catch (error) {
      console.error('Error generating marketing assets:', error);
      // Return default content if AI generation fails
      return this.generateDefaultMarketingAssets(course, salesPage);
    }
  }

  private buildMarketingPrompt(course: Course, salesPage: SalesPageContent): string {
    const modulesList = course.modules.map(m => `- ${m.title}: ${m.summary}`).join('\n');
    const benefits = salesPage.benefits.join(', ');
    const painPoints = salesPage.painPoints.join(', ');

    return `Create comprehensive marketing assets for this course launch:

Course: ${salesPage.courseName}
Headline: ${salesPage.headline}
Key Benefits: ${benefits}
Pain Points Addressed: ${painPoints}

Modules:
${modulesList}

Generate a JSON response with this exact structure:
{
  "tweets": [
    "5 promotional tweets for course launch (each under 280 characters)",
    "Include hooks, benefits, and CTAs",
    "Mix of educational and promotional content"
  ],
  "instagramCaptions": [
    "3 Instagram captions with hashtags",
    "Engaging, visual-focused copy",
    "Include relevant hashtags for reach"
  ],
  "videoScripts": [
    {
      "duration": "30s",
      "type": "talking-head",
      "script": "Complete 30-second video script with timing cues",
      "hooks": ["Opening hook options"],
      "callToAction": "Clear CTA for end of video"
    },
    {
      "duration": "60s",
      "type": "talking-head", 
      "script": "Complete 60-second video script with timing cues",
      "hooks": ["Opening hook options"],
      "callToAction": "Clear CTA for end of video"
    }
  ],
  "adHeadlines": [
    "5-7 compelling ad headlines for Facebook/Google ads",
    "Focus on benefits and transformation"
  ],
  "emailSubjects": [
    "5-7 email subject lines for launch sequence",
    "Mix of curiosity, urgency, and benefit-focused"
  ],
  "launchEmail": "Complete launch email template with subject, body, and CTA"
}

Make all copy benefit-focused, engaging, and conversion-optimized for each platform.`;
  }

  private generateDefaultMarketingAssets(course: Course, salesPage: SalesPageContent): MarketingAssets {
    return {
      tweets: this.generateDefaultTweets(course, salesPage),
      instagramCaptions: this.generateDefaultInstagramCaptions(course, salesPage),
      videoScripts: this.generateDefaultVideoScripts(course, salesPage),
      adHeadlines: this.generateDefaultAdHeadlines(course, salesPage),
      emailSubjects: this.generateDefaultEmailSubjects(course, salesPage),
      launchEmail: this.generateDefaultLaunchEmail(course, salesPage)
    };
  }

  private generateDefaultTweets(course: Course, salesPage: SalesPageContent): string[] {
    const courseName = salesPage.courseName;
    return [
      `🚀 Just launched: ${courseName}! Transform your approach with proven strategies that actually work. Get instant access: [link] #OnlineCourse #Learning`,
      
      `Stop struggling with scattered information. ${courseName} gives you a clear, step-by-step system to achieve real results. Limited time offer: [link]`,
      
      `What if you could master ${course.title.toLowerCase()} in just a few hours? My new course shows you exactly how: [link] #SkillBuilding #Growth`,
      
      `🔥 ${salesPage.benefits[0]} Ready to level up? Check out ${courseName}: [link]`,
      
      `Thread: The 3 biggest mistakes people make with ${course.title.toLowerCase()} (and how to avoid them) 🧵👇\n\n1/ [First mistake...]\n\nFull solution in my course: [link]`
    ];
  }

  private generateDefaultInstagramCaptions(course: Course, salesPage: SalesPageContent): string[] {
    return [
      `✨ COURSE LAUNCH DAY ✨\n\nAfter months of work, ${salesPage.courseName} is finally here! 🎉\n\nThis isn't just another course - it's a complete transformation system that will help you:\n${salesPage.benefits.slice(0, 3).map(b => `• ${b}`).join('\n')}\n\nSwipe to see what's inside 👉\n\nLink in bio for instant access!\n\n#OnlineCourse #SkillBuilding #Transformation #Learning #Growth #Success #CourseCreator #DigitalProduct`,
      
      `POV: You finally found a course that delivers on its promises 💯\n\n${salesPage.courseName} is different because:\n✅ Actionable strategies (not just theory)\n✅ Real-world examples\n✅ Step-by-step implementation\n✅ Proven results\n\nReady to transform your approach? Link in bio 🔗\n\n#CourseReview #OnlineLearning #SkillDevelopment #Success #Transformation #DigitalCourse #Learning`,
      
      `Behind the scenes: Creating ${salesPage.courseName} 📚\n\nThis course represents everything I've learned about ${course.title.toLowerCase()}. Every module is packed with insights that took me years to discover.\n\nNow you can learn it all in just a few hours ⏰\n\nWhat would you do with that time saved? 🤔\n\nGet started today - link in bio!\n\n#BehindTheScenes #CourseCreation #OnlineCourse #Learning #Efficiency #TimeManagement #Success`
    ];
  }

  private generateDefaultVideoScripts(course: Course, salesPage: SalesPageContent): VideoScript[] {
    return [
      {
        duration: '30s',
        type: 'talking-head',
        script: `[0-3s] Hook: "What if I told you that you could master ${course.title.toLowerCase()} in just a few hours?"\n\n[4-10s] Problem: "Most people struggle because they're getting scattered information from multiple sources."\n\n[11-20s] Solution: "That's why I created ${salesPage.courseName} - a complete system that gives you everything you need in one place."\n\n[21-27s] Benefit: "You'll get clear, actionable strategies that you can implement immediately."\n\n[28-30s] CTA: "Link in bio to get started today!"`,
        hooks: [
          `What if I told you that you could master ${course.title.toLowerCase()} in just a few hours?`,
          `The biggest mistake people make with ${course.title.toLowerCase()} is...`,
          `I wish someone had told me this about ${course.title.toLowerCase()} years ago...`
        ],
        callToAction: 'Link in bio to get started today!'
      },
      {
        duration: '60s',
        type: 'talking-head',
        script: `[0-5s] Hook: "Three years ago, I was struggling with the same ${course.title.toLowerCase()} challenges you might be facing right now."\n\n[6-15s] Story: "I was overwhelmed by conflicting advice, wasting time on strategies that didn't work, and feeling frustrated with my lack of progress."\n\n[16-25s] Transformation: "But then I discovered the system I'm about to share with you in ${salesPage.courseName}."\n\n[26-40s] Benefits: "This course will help you ${salesPage.benefits.slice(0, 2).join(' and ')}."\n\n[41-50s] Social Proof: "I've already helped hundreds of students achieve incredible results with this exact system."\n\n[51-57s] Urgency: "But this special launch price won't last long."\n\n[58-60s] CTA: "Click the link below to get instant access!"`,
        hooks: [
          `Three years ago, I was struggling with the same ${course.title.toLowerCase()} challenges you might be facing right now.`,
          `Let me tell you about the day everything changed for me with ${course.title.toLowerCase()}...`,
          `If you're struggling with ${course.title.toLowerCase()}, this video could change everything for you.`
        ],
        callToAction: 'Click the link below to get instant access!'
      }
    ];
  }

  private generateDefaultAdHeadlines(course: Course, salesPage: SalesPageContent): string[] {
    return [
      `Master ${course.title} in Record Time`,
      `The ${course.title} System That Actually Works`,
      `Stop Struggling With ${course.title} - Get Results Fast`,
      `Transform Your Approach to ${course.title} Today`,
      `The Complete ${course.title} Blueprint`,
      `From Beginner to Expert: ${course.title} Mastery`,
      `Proven ${course.title} Strategies That Deliver Results`
    ];
  }

  private generateDefaultEmailSubjects(course: Course, salesPage: SalesPageContent): string[] {
    return [
      `🚀 ${salesPage.courseName} is finally here!`,
      `Your ${course.title} transformation starts now`,
      `Last chance: Special launch pricing ends soon`,
      `The ${course.title} mistake that's costing you results`,
      `Inside: My complete ${course.title} system`,
      `Why most ${course.title} advice doesn't work (and what does)`,
      `[URGENT] Don't miss this ${course.title} opportunity`
    ];
  }

  private generateDefaultLaunchEmail(course: Course, salesPage: SalesPageContent): string {
    return `Subject: 🚀 ${salesPage.courseName} is finally here!

Hi [Name],

After months of work, I'm thrilled to announce that ${salesPage.courseName} is officially live!

This isn't just another course - it's the complete system I wish I had when I was starting out with ${course.title.toLowerCase()}.

Here's what you'll get inside:

${course.modules.map((module, index) => `Module ${index + 1}: ${module.title}\n${module.summary}`).join('\n\n')}

But here's the thing...

${salesPage.painPoints[0]}

That's exactly why I created this course. To give you a clear, step-by-step system that actually works.

When you join today, you'll also get:
${salesPage.pricingTiers[1].features.slice(1).map(feature => `✅ ${feature}`).join('\n')}

SPECIAL LAUNCH PRICING:
For the next 48 hours only, you can get the complete course for just $${salesPage.pricingTiers[0].price} (normally $${salesPage.pricingTiers[1].price}).

This is the lowest price it will ever be.

Ready to transform your approach to ${course.title.toLowerCase()}?

[GET INSTANT ACCESS NOW - $${salesPage.pricingTiers[0].price}]

Questions? Just reply to this email.

To your success,
[Your Name]

P.S. Remember, this special pricing ends in 48 hours. Don't miss out on this opportunity to finally master ${course.title.toLowerCase()}.

[GET INSTANT ACCESS NOW]`;
  }

  generateMarketingPackage(assets: MarketingAssets): string {
    return `# Marketing Asset Package

## Twitter/X Posts

${assets.tweets.map((tweet, index) => `### Tweet ${index + 1}
${tweet}

---`).join('\n\n')}

## Instagram Captions

${assets.instagramCaptions.map((caption, index) => `### Instagram Post ${index + 1}
${caption}

---`).join('\n\n')}

## Video Scripts

${assets.videoScripts.map((script, index) => `### ${script.duration} ${script.type} Video Script
**Hook Options:**
${script.hooks.map(hook => `- ${hook}`).join('\n')}

**Script:**
${script.script}

**Call to Action:** ${script.callToAction}

---`).join('\n\n')}

## Ad Headlines

${assets.adHeadlines.map((headline, index) => `${index + 1}. ${headline}`).join('\n')}

## Email Subject Lines

${assets.emailSubjects.map((subject, index) => `${index + 1}. ${subject}`).join('\n')}

## Launch Email Template

${assets.launchEmail}

---

*Generated by AI Course Alchemist*`;
  }
}

export const marketingGenerator = new MarketingGenerator();