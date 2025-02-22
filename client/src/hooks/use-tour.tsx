import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface TourStep {
  id: string;
  title: string;
  description: string;
  elementId?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  route?: string;
}

interface TourContextType {
  currentTour: string | null;
  currentStep: number;
  isActive: boolean;
  startTour: (tourId: string) => void;
  endTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

type Tours = {
  [key: string]: TourStep[];
};

const TOURS: Tours = {
  welcome: [
    {
      id: 'welcome',
      title: 'Welcome to OssRyu! 🥋',
      description: 'Let us show you around and help you get started with your BJJ training journey.',
    },
    {
      id: 'training-log',
      title: 'Track Your Progress',
      description: 'Log your training sessions, techniques practiced, and keep notes on your improvements.',
      elementId: 'training-log-button',
      placement: 'bottom',
    },
    {
      id: 'technique-library',
      title: 'Technique Library',
      description: 'Browse our comprehensive collection of BJJ techniques with detailed instructions and videos.',
      elementId: 'technique-library-nav',
      placement: 'bottom',
    },
    {
      id: 'community',
      title: 'Join the Community',
      description: 'Connect with fellow practitioners, share experiences, and find training partners.',
      elementId: 'community-nav',
      placement: 'right',
    },
    {
      id: 'achievements',
      title: 'Track Achievements',
      description: 'Set goals, earn badges, and track your belt progression journey.',
      elementId: 'achievements-section',
      placement: 'left',
    },
  ],
  community: [
    {
      id: 'community-intro',
      title: 'Welcome to the Community',
      description: 'Here you can connect with other BJJ practitioners and share your journey.',
    },
    {
      id: 'activity-feed',
      title: 'Activity Feed',
      description: 'See what your training partners are up to and engage with their progress.',
      elementId: 'activity-feed-tab',
      placement: 'bottom',
    },
    {
      id: 'training-partners',
      title: 'Find Training Partners',
      description: 'Discover and connect with practitioners at your level and in your area.',
      elementId: 'training-partners-section',
      placement: 'right',
    },
  ],
};

export function TourProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check if user has completed tours
    const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');

    // Show welcome tour for new users
    if (!completedTours.includes('welcome')) {
      startTour('welcome');
    }
  }, []);

  const startTour = (tourId: string) => {
    setCurrentTour(tourId);
    setCurrentStep(0);
    setIsActive(true);

    // Navigate to the first step's route if specified
    const firstStep = TOURS[tourId]?.[0];
    if (firstStep?.route) {
      setLocation(firstStep.route);
    }
  };

  const endTour = () => {
    if (currentTour) {
      // Save completed tour to localStorage
      const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');
      if (!completedTours.includes(currentTour)) {
        completedTours.push(currentTour);
        localStorage.setItem('completedTours', JSON.stringify(completedTours));
      }
    }

    setCurrentTour(null);
    setCurrentStep(0);
    setIsActive(false);
  };

  const nextStep = () => {
    if (!currentTour) return;

    const tour = TOURS[currentTour];
    if (currentStep < tour.length - 1) {
      setCurrentStep((prev) => prev + 1);

      // Navigate to the next step's route if specified
      const nextStepData = tour[currentStep + 1];
      if (nextStepData?.route) {
        setLocation(nextStepData.route);
      }
    } else {
      endTour();
    }
  };

  const previousStep = () => {
    if (!currentTour) return;

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);

      // Navigate to the previous step's route if specified
      const tour = TOURS[currentTour];
      const prevStepData = tour[currentStep - 1];
      if (prevStepData?.route) {
        setLocation(prevStepData.route);
      }
    }
  };

  return (
    <TourContext.Provider
      value={{
        currentTour,
        currentStep,
        isActive,
        startTour,
        endTour,
        nextStep,
        previousStep,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

export function getCurrentTourStep(): TourStep | null {
  const { currentTour, currentStep, isActive } = useTour();

  if (!isActive || !currentTour) return null;

  return TOURS[currentTour]?.[currentStep] || null;
}