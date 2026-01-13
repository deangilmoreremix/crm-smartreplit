import type { Express } from "express";

// In-memory storage for video emails (temporary until database schema is added)
interface VideoEmail {
  id: string;
  title: string;
  script: string;
  duration: number;
  thumbnail: string;
  status: 'draft' | 'processing' | 'ready' | 'sent';
  analytics: {
    views: number;
    completionRate: number;
    engagement: number;
    sentDate?: string;
  };
  gpt5Metadata: {
    generatedScript: boolean;
    optimizationScore: number;
    suggestedImprovements: string[];
    tone: string;
    targetAudience: string;
  };
  recipient?: {
    name: string;
    email: string;
    company: string;
  };
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Temporary in-memory storage
const videoEmails: VideoEmail[] = [];
const videoStats = {
  totalVideos: 0,
  totalViews: 0,
  averageEngagement: 0,
  conversionRate: 0,
  topPerformingVideo: ''
};

export function registerVideoRoutes(app: Express): void {
  // Get all videos for the authenticated user
  app.get('/api/videos', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Filter videos by user
      const userVideos = videoEmails.filter(video => video.profileId === userId);
      res.json(userVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Get video statistics
  app.get('/api/videos/stats', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Calculate stats from user's videos
      const userVideos = videoEmails.filter(video => video.profileId === userId);
      const stats = {
        totalVideos: userVideos.length,
        totalViews: userVideos.reduce((sum, video) => sum + video.analytics.views, 0),
        averageEngagement: userVideos.length > 0
          ? userVideos.reduce((sum, video) => sum + video.analytics.engagement, 0) / userVideos.length
          : 0,
        conversionRate: 0.15, // Mock conversion rate
        topPerformingVideo: userVideos.length > 0
          ? userVideos.reduce((top, video) =>
              video.analytics.views > (userVideos.find(v => v.title === top)?.analytics.views || 0)
                ? video.title : top, userVideos[0]?.title || '')
          : ''
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching video stats:', error);
      res.status(500).json({ error: 'Failed to fetch video stats' });
    }
  });

  // Create a new video email
  app.post('/api/videos', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { title, script, recipientName, recipientEmail, company } = req.body;

      if (!title || !script) {
        return res.status(400).json({ error: 'Title and script are required' });
      }

      const newVideo: VideoEmail = {
        id: crypto.randomUUID(),
        title,
        script,
        duration: Math.floor(script.length / 10), // Rough estimate based on script length
        thumbnail: '/api/placeholder/400/225', // Placeholder thumbnail
        status: 'draft',
        analytics: {
          views: 0,
          completionRate: 0,
          engagement: 0
        },
        gpt5Metadata: {
          generatedScript: false,
          optimizationScore: 0.8,
          suggestedImprovements: [],
          tone: 'professional',
          targetAudience: 'business'
        },
        recipient: recipientName && recipientEmail ? {
          name: recipientName,
          email: recipientEmail,
          company: company || ''
        } : undefined,
        profileId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      videoEmails.push(newVideo);
      res.status(201).json(newVideo);
    } catch (error) {
      console.error('Error creating video:', error);
      res.status(500).json({ error: 'Failed to create video' });
    }
  });

  // Get a specific video
  app.get('/api/videos/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const videoId = req.params.id;
      const video = videoEmails.find(v => v.id === videoId && v.profileId === userId);

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      res.json(video);
    } catch (error) {
      console.error('Error fetching video:', error);
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  });

  // Update a video
  app.put('/api/videos/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const videoId = req.params.id;
      const videoIndex = videoEmails.findIndex(v => v.id === videoId && v.profileId === userId);

      if (videoIndex === -1) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const updatedVideo = {
        ...videoEmails[videoIndex],
        ...req.body,
        updatedAt: new Date()
      };

      videoEmails[videoIndex] = updatedVideo;
      res.json(updatedVideo);
    } catch (error) {
      console.error('Error updating video:', error);
      res.status(500).json({ error: 'Failed to update video' });
    }
  });

  // Delete a video
  app.delete('/api/videos/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const videoId = req.params.id;
      const videoIndex = videoEmails.findIndex(v => v.id === videoId && v.profileId === userId);

      if (videoIndex === -1) {
        return res.status(404).json({ error: 'Video not found' });
      }

      videoEmails.splice(videoIndex, 1);
      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ error: 'Failed to delete video' });
    }
  });

  // Generate video script using AI
  app.post('/api/videos/generate-script', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { recipient, purpose, tone, length } = req.body;

      // Mock AI script generation
      const mockScripts = {
        demo: "Hello! I'm excited to show you how our solution can transform your business operations. Let me walk you through the key features that will save you time and increase productivity.",
        welcome: "Welcome to our community! I'm thrilled to have you here. Let me introduce myself and share what we can accomplish together.",
        followup: "I wanted to follow up on our previous conversation. Based on what we discussed, here are the next steps we can take to move forward.",
        announcement: "I have some exciting news to share with you. We've been working hard on improvements that I think you'll really appreciate."
      };

      const script = mockScripts[purpose as keyof typeof mockScripts] ||
        "Hello! Thank you for your time. I'd like to discuss how we can work together to achieve your goals.";

      res.json({
        script,
        tone,
        estimatedDuration: Math.ceil(script.length / 150), // Rough words per minute estimate
        suggestions: [
          "Add a personal touch by mentioning something specific about their business",
          "Include a clear call-to-action at the end",
          "Keep the script concise and engaging"
        ]
      });
    } catch (error) {
      console.error('Error generating script:', error);
      res.status(500).json({ error: 'Failed to generate script' });
    }
  });
}