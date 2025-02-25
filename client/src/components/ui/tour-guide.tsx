import { useEffect, useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { useTour, getCurrentTourStep } from '@/hooks/use-tour';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export function TourGuide() {
  const { isActive, endTour, nextStep, previousStep, currentStep } = useTour();
  const currentTourStep = getCurrentTourStep();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<TooltipPlacement>('bottom');

  useEffect(() => {
    if (!isActive || !currentTourStep?.elementId) return;

    const element = document.getElementById(currentTourStep.elementId);
    if (!element) return;

    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      const tooltipPlacement = (currentTourStep.placement || 'bottom') as TooltipPlacement;

      let top = 0;
      let left = 0;

      switch (tooltipPlacement) {
        case 'top':
          top = rect.top - 10;
          left = rect.right + 20;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.right + 20;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
      }

      setPosition({ top, left });
      setPlacement(tooltipPlacement);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentTourStep, isActive]);

  if (!isActive || !currentTourStep) return null;

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    transform: 'translate(-50%, -50%)',
    zIndex: 50,
    ...position,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={tooltipStyle}
      >
        <Card className="w-80">
          <CardHeader className="relative pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={endTour}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg pr-8">{currentTourStep.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{currentTourStep.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button size="sm" onClick={nextStep}>
              {currentStep === 0 ? "Let's Start!" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}