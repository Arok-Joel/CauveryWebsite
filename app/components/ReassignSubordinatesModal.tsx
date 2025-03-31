import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Subordinate {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PotentialManager {
  id: string;
  name: string;
  email: string;
  role: string;
  currentSubordinatesCount: number;
}

interface EmployeeBeingPromoted {
  id: string;
  name: string;
  email: string;
  currentRole: string;
  targetRole: string;
}

interface ReassignSubordinatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionRequestId: string;
  onReassignComplete: () => void;
}

export function ReassignSubordinatesModal({
  isOpen,
  onClose,
  promotionRequestId,
  onReassignComplete,
}: ReassignSubordinatesModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
  const [potentialManagers, setPotentialManagers] = useState<PotentialManager[]>([]);
  const [employeeBeingPromoted, setEmployeeBeingPromoted] = useState<EmployeeBeingPromoted | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [useAutoAssign, setUseAutoAssign] = useState(true);

  useEffect(() => {
    if (isOpen && promotionRequestId) {
      fetchSubordinatesData();
    }
  }, [isOpen, promotionRequestId]);

  // Auto-assign when managers or subordinates change
  useEffect(() => {
    if (useAutoAssign && subordinates.length > 0 && potentialManagers.length > 0) {
      // Simple auto-assign algorithm: distribute subordinates evenly among potential managers
      const newAssignments: Record<string, string> = {};
      
      // Sort managers by current subordinate count (ascending)
      const sortedManagers = [...potentialManagers].sort(
        (a, b) => a.currentSubordinatesCount - b.currentSubordinatesCount
      );
      
      // If no managers, we can't auto-assign
      if (sortedManagers.length === 0) {
        return;
      }
      
      // Assign each subordinate to the manager with the least subordinates
      subordinates.forEach((subordinate, index) => {
        // If we have fewer managers than subordinates, wrap around
        const managerIndex = index % sortedManagers.length;
        const manager = sortedManagers[managerIndex];
        
        // Update assignments
        newAssignments[subordinate.id] = manager.id;
        
        // Update manager's subordinate count for next assignment
        sortedManagers[managerIndex] = {
          ...manager,
          currentSubordinatesCount: manager.currentSubordinatesCount + 1,
        };
        
        // Re-sort managers after each assignment
        sortedManagers.sort((a, b) => a.currentSubordinatesCount - b.currentSubordinatesCount);
      });
      
      setAssignments(newAssignments);
    }
  }, [subordinates, potentialManagers, useAutoAssign]);

  async function fetchSubordinatesData() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/promotions/${promotionRequestId}/subordinates`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subordinates data');
      }

      const data = await response.json();
      setSubordinates(data.subordinates || []);
      setPotentialManagers(data.potentialManagers || []);
      setEmployeeBeingPromoted(data.employeeBeingPromoted || null);
      
    } catch (error) {
      console.error('Error fetching subordinates data:', error);
      toast.error('Failed to load subordinates data');
    } finally {
      setIsLoading(false);
    }
  }

  function formatRole(role: string) {
    return role.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  function handleSelectChange(subordinateId: string, managerId: string) {
    setAssignments(prev => ({
      ...prev,
      [subordinateId]: managerId,
    }));
    
    // Disable auto-assign when manually changing assignments
    setUseAutoAssign(false);
  }

  async function handleConfirmReassignment() {
    if (subordinates.length === 0 || Object.keys(assignments).length === 0) {
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      // Convert assignments to the format expected by the API
      const reassignments = Object.entries(assignments).map(([subordinateId, newManagerId]) => ({
        subordinateId,
        newManagerId,
      }));

      const response = await fetch(`/api/admin/promotions/${promotionRequestId}/reassign-subordinates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reassignments }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reassign subordinates');
      }

      toast.success('Subordinates reassigned successfully');
      onReassignComplete();
      onClose();
    } catch (error) {
      console.error('Error reassigning subordinates:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reassign subordinates');
    } finally {
      setIsProcessing(false);
    }
  }

  // If no subordinates or potential managers, directly close modal
  useEffect(() => {
    if (!isLoading && subordinates.length === 0) {
      // No subordinates to reassign, can close modal
      onClose();
    }
  }, [isLoading, subordinates, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reassign Subordinates</DialogTitle>
          <DialogDescription>
            {employeeBeingPromoted && (
              <span>
                When {employeeBeingPromoted.name} is promoted from {formatRole(employeeBeingPromoted.currentRole)} to {formatRole(employeeBeingPromoted.targetRole)}, 
                their current subordinates need to be reassigned to new managers.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading subordinates data...</span>
          </div>
        ) : (
          <>
            {subordinates.length > 0 ? (
              <>
                {potentialManagers.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
                    <p className="text-yellow-800">
                      No other managers are available for reassignment. The system will keep these subordinates reporting to this employee until other managers are available.
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">Subordinate Reassignments</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setUseAutoAssign(prev => !prev)}
                      >
                        {useAutoAssign ? 'Auto-assign enabled' : 'Enable auto-assign'}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {subordinates.map(subordinate => (
                        <div key={subordinate.id} className="p-3 border rounded-md">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{subordinate.name}</p>
                              <p className="text-sm text-muted-foreground">{formatRole(subordinate.role)}</p>
                            </div>
                            
                            <div className="w-full sm:w-64">
                              <Select
                                value={assignments[subordinate.id] || ''}
                                onValueChange={(value) => handleSelectChange(subordinate.id, value)}
                                disabled={potentialManagers.length === 0}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a new manager" />
                                </SelectTrigger>
                                <SelectContent>
                                  {potentialManagers.map(manager => (
                                    <SelectItem key={manager.id} value={manager.id}>
                                      {manager.name} ({manager.currentSubordinatesCount} current)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <UserCheck className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-lg">No subordinates to reassign</p>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirmReassignment} disabled={isLoading || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Reassignments'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 