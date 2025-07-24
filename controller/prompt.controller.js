import { Prompt } from "../model/prompt.model.js";

// CREATE new prompt
export const createPrompt = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Prompt (title) is required" });
    }

    const prompt = new Prompt({ title });
    await prompt.save();

    res.status(201).json({ message: "Prompt saved", prompt });
  } catch (error) {
    console.error("Error saving prompt:", error);
    res.status(500).json({ error: "Server error" });
  }
};



// GET analytics data
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, search, limit = 1000 } = req.body;
    
    // Build query object
    let query = {};
    
    // Date filtering
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }
    
    // Search filtering
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    // Fetch data from database
    const prompts = await Prompt.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Calculate statistics
    const analytics = calculateAnalytics(prompts);
    
    res.status(200).json({
      success: true,
      data: prompts,
      analytics,
      total: prompts.length
    });
    
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ 
      success: false, 
      error: "Server error while fetching analytics" 
    });
  }
};

// GET comprehensive analytics with aggregation
export const getDetailedAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    // Build match stage for aggregation
    let matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    
    // Aggregation pipeline for detailed analytics
    const analyticsData = await Prompt.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $facet: {
          // Total questions and basic stats
          basicStats: [
            {
              $group: {
                _id: null,
                totalQuestions: { $sum: 1 },
                uniqueUsers: { $addToSet: "$ipAddress" },
                avgResponseLength: { $avg: { $strLenCP: "$response" } },
                responses: { $push: "$response" }
              }
            },
            {
              $project: {
                totalQuestions: 1,
                uniqueUsers: { $size: "$uniqueUsers" },
                avgResponseLength: { $round: ["$avgResponseLength", 0] }
              }
            }
          ],
          
          // Daily statistics
          dailyStats: [
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" }
                },
                count: { $sum: 1 }
              }
            },
            {
              $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            },
            {
              $project: {
                date: {
                  $dateFromParts: {
                    year: "$_id.year",
                    month: "$_id.month",
                    day: "$_id.day"
                  }
                },
                count: 1,
                _id: 0
              }
            }
          ],
          
          // Hourly statistics
          hourlyStats: [
            {
              $group: {
                _id: { $hour: "$createdAt" },
                count: { $sum: 1 }
              }
            },
            {
              $sort: { "_id": 1 }
            },
            {
              $project: {
                hour: "$_id",
                count: 1,
                _id: 0
              }
            }
          ],
          
          // Top questions
          topQuestions: [
            {
              $group: {
                _id: { $toLower: "$title" },
                count: { $sum: 1 }
              }
            },
            {
              $sort: { count: -1 }
            },
            {
              $limit: 10
            },
            {
              $project: {
                question: "$_id",
                count: 1,
                _id: 0
              }
            }
          ],
          
          // IP address statistics
          ipStats: [
            {
              $group: {
                _id: "$ipAddress",
                count: { $sum: 1 }
              }
            },
            {
              $sort: { count: -1 }
            },
            {
              $limit: 10
            },
            {
              $project: {
                ip: "$_id",
                count: 1,
                _id: 0
              }
            }
          ],
          
          // Recent questions
          recentQuestions: [
            {
              $sort: { createdAt: -1 }
            },
            {
              $limit: 20
            }
          ]
        }
      }
    ]);
    
    // Format the response
    const result = analyticsData[0];
    const basicStats = result.basicStats[0] || { totalQuestions: 0, uniqueUsers: 0, avgResponseLength: 0 };
    
    // Fill missing hours with 0 count
    const hourlyStatsMap = {};
    result.hourlyStats.forEach(stat => {
      hourlyStatsMap[stat.hour] = stat.count;
    });
    
    const completeHourlyStats = [];
    for (let i = 0; i < 24; i++) {
      completeHourlyStats.push({
        hour: `${i.toString().padStart(2, '0')}:00`,
        count: hourlyStatsMap[i] || 0
      });
    }
    
    res.status(200).json({
      success: true,
      analytics: {
        totalQuestions: basicStats.totalQuestions,
        uniqueUsers: basicStats.uniqueUsers,
        avgResponseLength: basicStats.avgResponseLength,
        questionsPerUser: basicStats.uniqueUsers > 0 
          ? Math.round((basicStats.totalQuestions / basicStats.uniqueUsers) * 10) / 10 
          : 0,
        dailyStats: result.dailyStats,
        hourlyStats: completeHourlyStats,
        topQuestions: result.topQuestions,
        ipStats: result.ipStats,
        recentQuestions: result.recentQuestions
      }
    });
    
  } catch (error) {
    console.error("Error fetching detailed analytics:", error);
    res.status(500).json({ 
      success: false, 
      error: "Server error while fetching detailed analytics" 
    });
  }
};

// Helper function to calculate analytics from fetched data
const calculateAnalytics = (prompts) => {
  if (!prompts.length) {
    return {
      totalQuestions: 0,
      uniqueUsers: 0,
      avgResponseLength: 0,
      topQuestions: [],
      dailyStats: [],
      hourlyStats: [],
      ipStats: [],
      questionTypes: []
    };
  }
  
  const totalQuestions = prompts.length;
  const uniqueUsers = new Set(prompts.map(p => p.ipAddress)).size;
  const avgResponseLength = Math.round(
    prompts.reduce((acc, p) => acc + (p.response?.length || 0), 0) / totalQuestions
  );
  
  // Top questions
  const questionCounts = {};
  prompts.forEach(prompt => {
    const question = prompt.title.toLowerCase();
    questionCounts[question] = (questionCounts[question] || 0) + 1;
  });
  
  const topQuestions = Object.entries(questionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([question, count]) => ({ question, count }));
  
  // Daily stats
  const dailyData = {};
  prompts.forEach(prompt => {
    const date = new Date(prompt.createdAt).toDateString();
    dailyData[date] = (dailyData[date] || 0) + 1;
  });
  
  const dailyStats = Object.entries(dailyData)
    .map(([date, count]) => ({ 
      date: new Date(date).toISOString().split('T')[0], 
      count 
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Hourly stats
  const hourlyData = Array(24).fill(0);
  prompts.forEach(prompt => {
    const hour = new Date(prompt.createdAt).getHours();
    hourlyData[hour]++;
  });
  
  const hourlyStats = hourlyData.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    count
  }));
  
  // IP stats
  const ipCounts = {};
  prompts.forEach(prompt => {
    ipCounts[prompt.ipAddress] = (ipCounts[prompt.ipAddress] || 0) + 1;
  });
  
  const ipStats = Object.entries(ipCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
  
  // Question types categorization
  const questionTypes = [
    {
      type: 'Skills',
      count: prompts.filter(p => 
        /skill|technology|experience|tech/i.test(p.title)
      ).length
    },
    {
      type: 'Projects', 
      count: prompts.filter(p => 
        /project|work|built|create|develop/i.test(p.title)
      ).length
    },
    {
      type: 'Contact',
      count: prompts.filter(p => 
        /contact|email|reach|connect|available/i.test(p.title)
      ).length
    },
    {
      type: 'General',
      count: prompts.filter(p => 
        !/skill|technology|experience|tech|project|work|built|create|develop|contact|email|reach|connect|available/i.test(p.title)
      ).length
    }
  ].filter(type => type.count > 0);
  
  return {
    totalQuestions,
    uniqueUsers,
    avgResponseLength,
    topQuestions,
    dailyStats,
    hourlyStats,
    ipStats,
    questionTypes
  };
};

// GET analytics summary (quick stats only)
export const getAnalyticsSummary = async (req, res) => {
  try {
    const summary = await Prompt.aggregate([
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          uniqueUsers: { $addToSet: "$ipAddress" },
          avgResponseLength: { $avg: { $strLenCP: "$response" } },
          latestQuestion: { $max: "$createdAt" },
          oldestQuestion: { $min: "$createdAt" }
        }
      },
      {
        $project: {
          totalQuestions: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          avgResponseLength: { $round: ["$avgResponseLength", 0] },
          latestQuestion: 1,
          oldestQuestion: 1,
          questionsPerUser: {
            $round: [
              { $divide: ["$totalQuestions", { $size: "$uniqueUsers" }] },
              1
            ]
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      summary: summary[0] || {
        totalQuestions: 0,
        uniqueUsers: 0,
        avgResponseLength: 0,
        questionsPerUser: 0,
        latestQuestion: null,
        oldestQuestion: null
      }
    });
    
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    res.status(500).json({ 
      success: false, 
      error: "Server error while fetching summary" 
    });
  }
};