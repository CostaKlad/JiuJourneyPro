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

      const OFFSET = 16;
      let top = rect.top + rect.height / 2;
      let left = rect.right + OFFSET;

      // Ensure tooltip stays within viewport
      if (left + 320 > window.innerWidth) {
        left = rect.left - 320 - OFFSET;
      }

      if (top + 200 > window.innerHeight) {
        top = window.innerHeight - 200 - OFFSET;
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
    transform: 'translateY(-50%)',
    zIndex: 50,
    ...position,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={tooltipStyle}
      >
        <Card className="w-80 shadow-lg backdrop-blur-sm bg-background/95 border-primary/10">
          <CardHeader className="relative pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              onClick={endTour}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg pr-8 leading-tight">{currentTourStep.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{currentTourStep.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              disabled={currentStep === 0}
              className="hover:bg-primary/5"
            >
              Previous
            </Button>
            <Button 
              size="sm" 
              onClick={nextStep}
              className="bg-primary/10 hover:bg-primary/20 text-primary"
            >
              {currentStep === 0 ? "Let's Start!" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}