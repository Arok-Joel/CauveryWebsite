import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Milestone } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface PromotionEligibilityData {
  eligible: boolean;
  applied: boolean;
  message: string;
  role: string;
  nextRole?: string;
  plotsSold?: number;
  plotsRequired?: number;
  conditionMet?: string;
}

export function PromotionCard() {
  const [eligibilityData, setEligibilityData] = useState<PromotionEligibilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isAddingCommissions, setIsAddingCommissions] = useState(false);
  
  // Only show dev tools in development environment
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    async function checkEligibility() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/employee/promotion/check-eligibility', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to check promotion eligibility');
        }

        const data = await response.json();
        setEligibilityData(data);
      } catch (error) {
        console.error('Error checking promotion eligibility:', error);
        toast.error('Failed to check promotion eligibility');
      } finally {
        setIsLoading(false);
      }
    }

    checkEligibility();
  }, []);

  async function handleApplyForPromotion() {
    if (!eligibilityData?.eligible || eligibilityData.applied) {
      return;
    }

    try {
      setIsApplying(true);
      const response = await fetch('/api/employee/promotion/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          condition: eligibilityData.conditionMet,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply for promotion');
      }

      const data = await response.json();
      toast.success('Promotion request submitted successfully');
      
      // Update the local state to show as applied
      setEligibilityData(prev => prev ? { ...prev, applied: true } : null);
    } catch (error) {
      console.error('Error applying for promotion:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply for promotion');
    } finally {
      setIsApplying(false);
    }
  }

  async function handleAddTestCommissions() {
    try {
      setIsAddingCommissions(true);
      const response = await fetch('/api/employee/promotion/test-add-commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 20, // Add 20 commissions to meet field officer promotion requirement
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add test commissions');
      }

      const data = await response.json();
      toast.success(data.message);
      
      // Refresh eligibility data
      window.location.reload();
    } catch (error) {
      console.error('Error adding test commissions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add test commissions');
    } finally {
      setIsAddingCommissions(false);
    }
  }

  function formatRole(role: string) {
    return role.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Milestone className="mr-2 h-5 w-5 text-[#3C5A3E]" />
            <Skeleton className="h-5 w-36" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show the card if not eligible and the employee is not a field officer, joint director, or director
  if (!eligibilityData?.eligible && 
      !['FIELD_OFFICER', 'JOINT_DIRECTOR', 'DIRECTOR'].includes(eligibilityData?.role || '')) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Milestone className="mr-2 h-5 w-5 text-[#3C5A3E]" />
          Career Advancement
        </CardTitle>
        <CardDescription>
          Your promotion status and opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {eligibilityData ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Role:</span>
                <Badge className="bg-[#3C5A3E] hover:bg-[#3C5A3E]/90">
                  {eligibilityData.role ? formatRole(eligibilityData.role) : 'Loading...'}
                </Badge>
              </div>
              
              {eligibilityData.nextRole && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Next Role:</span>
                  <Badge variant="outline" className="bg-[#3C5A3E]/10 text-[#3C5A3E] border-[#3C5A3E]/20">
                    {formatRole(eligibilityData.nextRole)}
                  </Badge>
                </div>
              )}
              
              {eligibilityData.plotsSold !== undefined && eligibilityData.plotsRequired !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress: {eligibilityData.plotsSold} / {eligibilityData.plotsRequired} plots</span>
                    <span>{Math.min(100, Math.round((eligibilityData.plotsSold / eligibilityData.plotsRequired) * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#3C5A3E] h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((eligibilityData.plotsSold / eligibilityData.plotsRequired) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600">
              {eligibilityData.message}
            </p>
            
            {eligibilityData.eligible && (
              <div>
                {eligibilityData.applied ? (
                  <Button
                    disabled
                    className="bg-[#3C5A3E]/50 hover:bg-[#3C5A3E]/50 cursor-not-allowed"
                  >
                    Applied for Promotion
                  </Button>
                ) : (
                  <Button
                    onClick={handleApplyForPromotion}
                    disabled={isApplying}
                    className="bg-[#3C5A3E] hover:bg-[#3C5A3E]/90"
                  >
                    {isApplying ? 'Applying...' : 'Apply for Promotion'}
                  </Button>
                )}
                
                {eligibilityData.conditionMet && !eligibilityData.applied && (
                  <p className="text-xs text-gray-500 mt-2">
                    Criteria met: {eligibilityData.conditionMet}
                  </p>
                )}
              </div>
            )}
            
            {isDevelopment && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2">Developer Testing Tools</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTestCommissions}
                  disabled={isAddingCommissions}
                  className="text-xs"
                >
                  {isAddingCommissions ? 'Adding...' : 'Add 20 Test Commissions'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Failed to load promotion information. Please try again later.
          </p>
        )}
      </CardContent>
    </Card>
  );
} 