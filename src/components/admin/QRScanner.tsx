import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (ticketId: string) => void;
}

export const QRScanner = ({ isOpen, onClose, onScanSuccess }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const processTicketId = async (ticketId: string) => {
    try {
      // Check if ticket exists and get details
      const { data: purchase, error } = await supabase
        .from('ticket_purchases')
        .select(`
          *,
          events (
            name,
            date,
            location
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error || !purchase) {
        toast({
          title: "Invalid Ticket",
          description: "Ticket not found or invalid QR code.",
          variant: "destructive",
        });
        return;
      }

      // Check if already checked in
      if (purchase.checked_in) {
        toast({
          title: "Already Checked In",
          description: `${purchase.buyer_name} is already checked in.`,
          variant: "destructive",
        });
        return;
      }

      // Check in the attendee
      await supabase
        .from('ticket_purchases')
        .update({ 
          checked_in: true,
          check_in_time: new Date().toISOString()
        })
        .eq('id', ticketId);

      toast({
        title: "Check-in Successful",
        description: `${purchase.buyer_name} checked in successfully!`,
      });

      onScanSuccess(ticketId);
      onClose();
    } catch (error) {
      console.error('Error processing ticket:', error);
      toast({
        title: "Error",
        description: "Failed to process ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManualInput = () => {
    const ticketId = prompt('Enter Ticket ID manually:');
    if (ticketId) {
      processTicketId(ticketId);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Simple QR detection (you might want to use a proper QR library like qr-scanner)
  useEffect(() => {
    if (!isScanning || !videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const detectQR = () => {
      if (!videoRef.current || !context) return;
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      // Here you would normally use a QR detection library
      // For now, we'll just provide manual input
    };

    const interval = setInterval(detectQR, 500);
    return () => clearInterval(interval);
  }, [isScanning]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={startCamera}>Try Again</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover rounded-lg bg-black"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 border-2 border-primary rounded-lg">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-32 h-32 border-2 border-white rounded-lg"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Point camera at QR code on ticket
                  </p>
                  <Button 
                    onClick={handleManualInput}
                    variant="outline"
                    size="sm"
                  >
                    Enter Ticket ID Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};