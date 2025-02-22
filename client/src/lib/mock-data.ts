// Mock data for testing the community page
import { User } from "@shared/schema";

export const mockFollowers = [
  {
    id: 1,
    username: "JohnDoe",
    beltRank: "Purple",
    gym: "Gracie Barra HQ",
    email: "john@example.com",
    password: "hashed_password",
    goals: "Improve guard game",
    totalPoints: 1200,
    level: 3,
    resetPasswordToken: null,
    resetPasswordExpires: null
  },
  {
    id: 2,
    username: "AliceSmith",
    beltRank: "Blue",
    gym: "10th Planet",
    email: "alice@example.com",
    password: "hashed_password",
    goals: "Competition prep",
    totalPoints: 800,
    level: 2,
    resetPasswordToken: null,
    resetPasswordExpires: null
  }
];

export const mockFollowing = [
  {
    id: 4,
    username: "CarolWhite",
    beltRank: "Black",
    gym: "Atos Jiu-Jitsu",
    email: "carol@example.com",
    password: "hashed_password",
    goals: "Teaching and competing",
    totalPoints: 2500,
    level: 5,
    resetPasswordToken: null,
    resetPasswordExpires: null
  },
  {
    id: 5,
    username: "DaveWilson",
    beltRank: "White",
    gym: "Gracie Academy",
    email: "dave@example.com",
    password: "hashed_password",
    goals: "Learn fundamentals",
    totalPoints: 300,
    level: 1,
    resetPasswordToken: null,
    resetPasswordExpires: null
  }
];

export const mockTrainingLogs = [
  {
    id: 1,
    user: mockFollowers[0],
    date: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    type: "Training",
    duration: 90,
    energyLevel: 4,
    techniquesPracticed: ["Arm Bar", "Triangle", "Kimura"],
    notes: "Great session focusing on submissions from guard. Partner gave excellent resistance.",
    likes: 12,
    hasLiked: false,
    comments: [
      {
        id: 1,
        user: mockFollowing[0],
        content: "Nice work! Let's train together next time!",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ]
  },
  {
    id: 2,
    user: mockFollowing[1],
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    type: "Competition",
    duration: 120,
    energyLevel: 5,
    techniquesPracticed: ["Single Leg", "Mount Escapes", "Back Takes"],
    notes: "First competition of the year! Won gold in my division.",
    likes: 25,
    hasLiked: true,
    comments: [
      {
        id: 2,
        user: mockFollowers[1],
        content: "Congratulations! 🎉",
        createdAt: new Date(Date.now() - 1000 * 60 * 100).toISOString()
      }
    ]
  }
];

export const mockSuggestedPartners = [
  {
    id: 6,
    username: "EmilyBrown",
    beltRank: "Purple",
    gym: "Gracie Barra HQ",
    email: "emily@example.com",
    password: "hashed_password",
    goals: "Improve leg locks",
    totalPoints: 1500,
    level: 4,
    resetPasswordToken: null,
    resetPasswordExpires: null
  },
  {
    id: 7,
    username: "FrankMiller",
    beltRank: "Blue",
    gym: "10th Planet",
    email: "frank@example.com",
    password: "hashed_password",
    goals: "Work on transitions",
    totalPoints: 900,
    level: 2,
    resetPasswordToken: null,
    resetPasswordExpires: null
  }
];

export const mockUserStats = {
  totalSessions: 156,
  totalHours: 234,
  techniquesLearned: 48,
  achievements: [
    {
      id: 1,
      type: "streak",
      name: "Consistent Warrior",
      description: "Train 5 days in a row",
      unlocked: true,
      level: 3
    },
    {
      id: 2,
      type: "technique",
      name: "Submission Hunter",
      description: "Successfully drill 50 different submissions",
      unlocked: false,
      progress: 42,
      required: 50
    },
    {
      id: 3,
      type: "competition",
      name: "Tournament Veteran",
      description: "Compete in 5 tournaments",
      unlocked: true,
      level: 1
    }
  ]
};