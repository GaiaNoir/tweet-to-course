'use client';

import { useState } from 'react';
import { Navigation, CourseDisplay } from '@/components/ui';
import { Course, UserProfile } from '@/types';

// Demo course data with comprehensive format
const demoCourse: Course = {
  id: 'demo-course-1',
  title: 'Twitter Growth Mastery: The Complete System That Generated 50K Followers',
  description: 'A comprehensive guide to growing your Twitter following and engagement',
  modules: [
    {
      id: 'module-1',
      title: 'Foundation: How I Discovered What Actually Works',
      summary: `## Course Overview
This comprehensive course will teach you the exact system I used to grow from 0 to 50,000 Twitter followers in 12 months, generating over $100,000 in revenue through strategic content and community building.

**Target Audience:** Entrepreneurs, content creators, and professionals looking to build a meaningful Twitter presence that drives real business results.

**Learning Outcomes:**
- Master the psychology of viral content creation
- Build a systematic approach to consistent growth
- Develop authentic engagement strategies that convert
- Create content frameworks that generate leads
- Implement advanced growth tactics used by top creators

**Estimated Time:** 2-3 hours for complete mastery

### 📖 Complete Module Content

I remember the exact moment everything changed. It was 3 AM, and I was staring at my Twitter analytics showing a pathetic 47 followers after six months of "trying." I had been following all the conventional advice about posting inspirational quotes and using trending hashtags, but nothing was working. That night, I had a realization that would transform not just my Twitter presence, but my entire business.

**The Foundation Framework:**

The breakthrough came when I stopped trying to please everyone and started focusing on solving one specific problem for one specific audience. Instead of generic motivational content, I began sharing the exact struggles I was facing as a bootstrapped entrepreneur, complete with revenue numbers, failed experiments, and honest reflections.

1. **Authenticity Over Perfection**: I started posting screenshots of my actual revenue dashboard, showing both wins and losses. My first vulnerable post about losing $5,000 on a failed product launch got 847 retweets and 156 new followers in 24 hours.

2. **Value-First Approach**: Every tweet had to pass the "screenshot test" - would someone screenshot this and save it for later? I began sharing specific tactics, exact email templates, and step-by-step processes that people could implement immediately.

3. **Consistent Voice Development**: I developed what I call the "coffee shop conversation" tone - professional enough to be credible, casual enough to be relatable. This meant using contractions, sharing personal anecdotes, and admitting when I didn't know something.

4. **Strategic Vulnerability**: I learned to share failures and struggles in a way that provided value, not just sympathy. Each setback became a case study that others could learn from.

**Implementation Tools:**
- Content calendar template with 30 proven tweet formats
- Analytics tracking spreadsheet to measure what actually works
- Engagement automation tools (Buffer, Hypefury) for consistency
- Community building strategies that turn followers into customers

**Common Mistakes to Avoid:**
- Posting without a clear value proposition for your audience
- Trying to go viral instead of building genuine relationships
- Copying other people's content without adding your unique perspective
- Focusing on follower count instead of engagement quality

**Results Timeline:**
- Week 1-2: Establish your unique voice and content pillars
- Month 1: Reach your first 1,000 engaged followers
- Month 3: Generate your first $1,000 from Twitter-driven sales
- Month 6: Build a sustainable system generating 5,000+ new followers monthly
- Month 12: Achieve 50,000+ followers with consistent revenue generation`,
      takeaways: [
        'The authenticity breakthrough - Why vulnerability beats perfection every time',
        'My proven content framework - The exact system for creating screenshot-worthy tweets',
        'The psychology of viral content - Understanding what makes people share and engage',
        'Real implementation timeline - Specific milestones with measurable outcomes and exact strategies'
      ],
      order: 1,
      estimatedReadTime: 8
    },
    {
      id: 'module-2',
      title: 'Implementation: My 90-Day Transformation System',
      summary: `### 📖 Complete Module Content

After discovering what worked, I needed a systematic approach to scale it. The problem wasn't knowing what to do - it was doing it consistently while maintaining quality and authenticity. Most people fail at Twitter growth because they treat it like a sprint instead of a marathon with systematic processes.

**The 90-Day Growth Architecture:**

My transformation system is built around three 30-day phases, each with specific goals, daily actions, and measurable outcomes. This isn't about posting more - it's about posting smarter with systematic precision.

**Phase 1 (Days 1-30): Foundation Building**
Every morning at 6 AM, I spend exactly 47 minutes on what I call "Twitter Foundation Time." This includes 15 minutes of industry research, 20 minutes writing and scheduling content, and 12 minutes engaging with my target audience. The key is treating this like a non-negotiable business meeting with yourself.

**Phase 2 (Days 31-60): Momentum Building**
This is where most people plateau, but I had a secret weapon: the "Value Bomb" strategy. Every Tuesday and Thursday, I would share something so valuable that people couldn't help but save and share it.

**Phase 3 (Days 61-90): Scaling and Systematization**
By day 60, I had proven what worked. Now it was time to systematize and scale. I created content templates for my highest-performing tweet types, built relationships with other creators for cross-promotion, and developed what I call "conversation starters."

**Tools That Make Success Inevitable:**
- Hypefury for scheduling and thread creation
- Buffer for content calendar management
- Notion for content idea storage and organization
- Canva for visual content creation
- Analytics tracking via Twitter's native tools plus third-party insights`,
      takeaways: [
        'Complete 90-day system - Daily, weekly, and monthly actions that guarantee measurable progress',
        'Advanced psychological strategies - Working with human nature instead of fighting against it',
        'My proprietary troubleshooting system - Overcoming common obstacles quickly and effectively',
        'Acceleration techniques - Methods that can triple or quadruple typical growth timelines'
      ],
      order: 2,
      estimatedReadTime: 9
    },
    {
      id: 'module-3',
      title: 'Advanced Methods: Creating Exponential Growth',
      summary: `### 📖 Complete Module Content

Three months in, I hit my first major plateau. I was gaining followers steadily, but the growth was linear - predictable but not explosive. That's when I realized that incremental improvement would never get me to the level I aspired to reach.

**The Exponential Breakthrough Methodology:**

The turning point came when I started studying the top 0.1% of Twitter creators - not just what they posted, but how they thought about content, community, and conversion. I discovered that they weren't just creating content; they were creating movements, conversations, and ecosystems.

**The 10x Growth Framework:**

Instead of trying to get 10% better at everything, I focused on getting 10x better at three specific things: pattern recognition, opportunity identification, and community activation. This shift in thinking led to my first viral thread that gained 47,000 retweets and 156,000 likes in 72 hours.

**Advanced Tools Most People Never Discover:**
- TweetDeck for real-time conversation monitoring and trend identification
- Social Blade for competitive analysis and growth tracking
- Buzzsumo for content research and viral pattern analysis
- Custom Google Alerts for industry trend monitoring
- Zapier automations for engagement and follow-up sequences`,
      takeaways: [
        'Exponential breakthrough methodology - Creating 10x improvements in weeks instead of incremental progress',
        'Advanced pattern recognition systems - Used by the top 0.1% of performers to identify viral opportunities',
        'Proprietary growth partnership strategies - Tools and methodologies that most practitioners never discover',
        'Expert-level risk management systems - Enabling aggressive optimization while preventing failures'
      ],
      order: 3,
      estimatedReadTime: 10
    },
    {
      id: 'module-4',
      title: 'Elite Psychology: Mental Models for Mastery',
      summary: `### 📖 Complete Module Content

The biggest transformation in my Twitter journey wasn't tactical - it was psychological. For months, I was trapped by limiting beliefs about what I could share, who would listen to me, and whether I deserved to have a platform.

**The Mental Transformation Story:**

I used to spend hours crafting the "perfect" tweet, then delete it because I convinced myself it wasn't good enough. I had impostor syndrome so severe that I would research topics for days before feeling qualified to share a single insight.

**The Cognitive Architecture of Elite Performers:**

After studying hundreds of successful Twitter creators, I identified five mental models that separate the top 1% from everyone else:

1. **The Abundance Mindset:** Elite creators don't hoard information - they give away their best insights freely
2. **The Long-Term Perspective:** While others chase viral moments, elite creators focus on building sustainable systems
3. **The Learning Orientation:** Every interaction becomes a data point for improvement
4. **The Service Mentality:** The best creators see themselves as servants of their audience
5. **The Systems Thinking:** They understand that success comes from optimizing the entire system

**My Personal Mental Training System:**

Every morning, I spend 10 minutes on what I call "mindset calibration." This includes reviewing my core values, visualizing successful interactions, and setting intentions for how I want to show up online that day.`,
      takeaways: [
        'Complete cognitive architecture - Specific mental models and thinking patterns used by elite performers',
        'Advanced mental training system - Daily practices, visualization techniques, and cognitive exercises',
        'Expert-level emotional intelligence protocols - Maintaining peak performance under extreme pressure',
        'Psychological resilience systems - Preventing burnout while enabling long-term mastery and growth'
      ],
      order: 4,
      estimatedReadTime: 9
    },
    {
      id: 'module-5',
      title: 'Legacy Building: Creating Lasting Impact',
      summary: `### 📖 Complete Module Content

As my Twitter following grew past 40,000, something unexpected happened. The metrics that once excited me - follower count, likes, retweets - started feeling hollow. I realized I had been optimizing for vanity metrics instead of meaningful impact.

**The Evolution from Success to Significance:**

The shift began when I received a DM from a follower who said my content had helped her start a business that was now generating $15,000 per month. She wasn't thanking me for entertainment or inspiration - she was thanking me for practical guidance that had changed her life.

**My Systematic Approach to Building Authority:**

Building true authority isn't about having the most followers - it's about being the person others turn to when they need real solutions. I developed what I call the "Authority Architecture" - a systematic approach to becoming a recognized expert in your field.

**The Authority Architecture Framework:**

1. **Thought Leadership Development:** Instead of just sharing tips, I began sharing frameworks, methodologies, and original research
2. **Community Building:** I shifted from broadcasting to facilitating
3. **Knowledge Transfer Systems:** I realized that my insights would only have lasting impact if I could transfer them effectively
4. **Institution Building:** The ultimate goal became building something that could outlast my personal involvement

**Impact Measurement Systems:**

I developed sophisticated systems for tracking not just my own success, but the success of people I've influenced. This includes revenue generated by community members, follower growth of people I've mentored, and business opportunities created through introductions.`,
      takeaways: [
        'Complete legacy-building methodology - Transforming personal mastery into lasting institutional impact',
        'Advanced authority and thought leadership systems - Creating enduring influence and recognition',
        'Sophisticated knowledge transfer frameworks - Ensuring insights continue creating value across generations',
        'Impact measurement and optimization systems - Maximizing long-term transformation and contribution'
      ],
      order: 5,
      estimatedReadTime: 11
    }
  ],
  metadata: {
    sourceType: 'thread',
    sourceUrl: 'https://twitter.com/example/status/1234567890',
    originalContent: 'The best way to grow on Twitter is consistency + authenticity + value. Most people fail because they optimize for vanity metrics instead of genuine relationships. Here\'s the system that got me to 50K followers...',
    generatedAt: new Date().toISOString(),
    version: 1
  }
};

const demoFreeUser: UserProfile = {
  id: 'demo-user-free',
  email: 'demo@example.com',
  subscriptionTier: 'free',
  usageCount: 1,
  createdAt: '2024-01-01T00:00:00Z',
  lastActive: new Date().toISOString()
};

const demoProUser: UserProfile = {
  id: 'demo-user-pro',
  email: 'pro@example.com',
  subscriptionTier: 'pro',
  usageCount: 15,
  createdAt: '2024-01-01T00:00:00Z',
  lastActive: new Date().toISOString()
};

export default function DemoPage() {
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingComplete, setIsExportingComplete] = useState(false);
  const [courseTitle, setCourseTitle] = useState(demoCourse.title);
  const [isNotionConnected, setIsNotionConnected] = useState(false);

  const currentUser = userTier === 'free' ? demoFreeUser : demoProUser;
  const currentCourse = { ...demoCourse, title: courseTitle };

  const handleTitleUpdate = (newTitle: string) => {
    setCourseTitle(newTitle);
    console.log('Title updated to:', newTitle);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRegenerating(false);
    console.log('Course regenerated');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    console.log('PDF exported');
  };

  const handleExportComplete = async () => {
    setIsExportingComplete(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsExportingComplete(false);
    console.log('Complete package exported');
  };

  const handleNotionConnectionRequired = () => {
    console.log('Notion connection required');
    alert('This would redirect to connect your Notion account');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <main className="max-w-6xl mx-auto container-padding py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Premium Course Display Demo
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Experience the new comprehensive course format with detailed modules, learning outcomes, and professional presentation.
          </p>
          
          {/* User Tier Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <span className="text-gray-700 font-medium text-sm sm:text-base">Demo as:</span>
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setUserTier('free')}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${
                  userTier === 'free'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Free User
              </button>
              <button
                onClick={() => setUserTier('pro')}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${
                  userTier === 'pro'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pro User
              </button>
            </div>
          </div>

          {/* Notion Connection Toggle (for Pro users) */}
          {userTier === 'pro' && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <span className="text-gray-700 font-medium text-sm sm:text-base">Notion Status:</span>
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setIsNotionConnected(false)}
                  className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${
                    !isNotionConnected
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Disconnected
                </button>
                <button
                  onClick={() => setIsNotionConnected(true)}
                  className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${
                    isNotionConnected
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Connected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Course Display */}
        <CourseDisplay
          course={currentCourse}
          onTitleUpdate={handleTitleUpdate}
          onRegenerate={handleRegenerate}
          onExportPDF={handleExportPDF}
          onExportComplete={handleExportComplete}
          isRegenerating={isRegenerating}
          isExporting={isExporting}
          isExportingComplete={isExportingComplete}
          isNotionConnected={isNotionConnected}
          onNotionConnectionRequired={handleNotionConnectionRequired}
        />

        {/* Feature Highlights */}
        <div className="mt-12 sm:mt-16 bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            New Premium Course Format Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-indigo-600 text-lg sm:text-xl">📚</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Course Overview</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Professional course header with learning outcomes and target audience
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-indigo-600 text-lg sm:text-xl">📖</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Rich Content</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Detailed modules with markdown formatting and comprehensive content
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-indigo-600 text-lg sm:text-xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Enhanced Takeaways</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Structured key takeaways with detailed explanations and benefits
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-indigo-600 text-lg sm:text-xl">💎</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Premium Design</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Professional layout worthy of $25-$90 course pricing
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-indigo-600 text-lg sm:text-xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Detailed Metrics</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Word counts, read times, and comprehensive module information
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-indigo-600 text-lg sm:text-xl">🚀</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Actionable Content</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Every module includes specific tools, frameworks, and implementation steps
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            Try expanding the modules to see the full comprehensive content format. Switch between user tiers to see different features.
          </p>
        </div>
      </main>
    </div>
  );
}