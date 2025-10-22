"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Scan, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  CreditCard,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { QRData } from './QRGenerator';

export interface PaymentData {
  fromUserId: number;
  toUserId: number;
  amountFiat?: number;
  amountMUSD?: number;
  fiatCurrency?: string;
  memo?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  txHash?: string;
  amountMUSD?: number;
  autoBorrowed?: boolean;
  borrowAmount?: number;
  message?: string;
  error?: string;
}

export interface QRScannerProps {
  currentUserId: number;
  currentUserAddress: string;
  onPaymentComplete?: (result: PaymentResult) => void;
  onCancel?: () => void;
}

export function QRScanner({ currentUserId, currentUserAddress, onPaymentComplete, onCancel }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customCurrency, setCustomCurrency] = useState<string>('USD');
  const [memo, setMemo] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const supportedCurrencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // TODO: Implement actual QR code detection
      /*
      // Using @zxing/library or jsQR
      import jsQR from 'jsqr';
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      const scanFrame = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            try {
              const qrData = JSON.parse(code.data);
              if (qrData.type === 'mezofi_pay') {
                handleQRDetected(qrData);
                return;
              }
            } catch (error) {
              console.warn('Invalid QR code format:', error);
            }
          }
        }
        
        if (isScanning) {
          requestAnimationFrame(scanFrame);
        }
      };
      
      scanFrame();
      */
      
      // Mock QR detection for development
      setTimeout(() => {
        if (isScanning) {
          const mockQRData: QRData = {
            version: '1.0',
            type: 'mezofi_pay',
            userId: 2,
            userName: 'John Doe',
            userAddress: '0x1234567890abcdef1234567890abcdef12345678',
            defaultAmountFiat: 25.50,
            fiatCurrency: 'USD',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            timestamp: new Date().toISOString()
          };
          handleQRDetected(mockQRData);
        }
      }, 3000); // Mock 3-second scan
      
    } catch (error) {
      console.error('Camera access error:', error);
      setError('Failed to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleQRDetected = (qrData: QRData) => {
    stopCamera();
    
    // Validate QR code
    if (qrData.type !== 'mezofi_pay') {
      setError('Invalid QR code. This is not a MezoFi payment QR.');
      return;
    }
    
    // Check expiry
    const now = new Date();
    const expiry = new Date(qrData.expiresAt);
    if (now > expiry) {
      setError('This QR code has expired. Please ask for a new one.');
      return;
    }
    
    // Check if trying to pay self
    if (qrData.userId === currentUserId) {
      setError('You cannot pay yourself.');
      return;
    }
    
    setScannedData(qrData);
    
    // Set default values from QR
    if (qrData.defaultAmountFiat) {
      setCustomAmount(qrData.defaultAmountFiat.toString());
    }
    if (qrData.fiatCurrency) {
      setCustomCurrency(qrData.fiatCurrency);
    }
    
    toast.success('QR code scanned successfully!');
  };

  const handlePayment = async () => {
    if (!scannedData) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // Determine payment amount
      const paymentAmount = customAmount ? parseFloat(customAmount) : scannedData.defaultAmountFiat;
      
      if (!paymentAmount || paymentAmount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }
      
      // Prepare payment data
      const paymentData: PaymentData = {
        fromUserId: currentUserId,
        toUserId: scannedData.userId,
        amountFiat: paymentAmount,
        fiatCurrency: customCurrency,
        memo: memo || `Payment to ${scannedData.userName}`
      };
      
      // Call payment API
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      const result: PaymentResult = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }
      
      // Success!
      toast.success(result.message || 'Payment completed successfully!');
      onPaymentComplete?.(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    stopCamera();
    setScannedData(null);
    setCustomAmount('');
    setCustomCurrency('USD');
    setMemo('');
    setError('');
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyInfo = supportedCurrencies.find(c => c.code === currency);
    return `${currencyInfo?.symbol || ''}${amount.toFixed(2)} ${currency}`;
  };

  if (scannedData) {
    // Payment confirmation screen
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Confirm Payment
          </CardTitle>
          <CardDescription>
            Review payment details before confirming
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Recipient Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Paying to:</Label>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{scannedData.userName}</div>
                <div className="text-xs text-muted-foreground">
                  {scannedData.userAddress.slice(0, 8)}...{scannedData.userAddress.slice(-6)}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Payment Amount */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder={scannedData.defaultAmountFiat?.toString() || '0.00'}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={customCurrency} onValueChange={setCustomCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Amount Preview */}
            {customAmount && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900">
                  Total: {formatCurrency(parseFloat(customAmount), customCurrency)}
                </div>
                <div className="text-xs text-blue-700">
                  ≈ {parseFloat(customAmount).toFixed(6)} MUSD (estimated)
                </div>
              </div>
            )}
          </div>
          
          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo">Memo (Optional)</Label>
            <Input
              id="memo"
              placeholder="Payment description..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={100}
            />
          </div>
          
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={reset}
              disabled={isProcessing}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button 
              onClick={handlePayment}
              disabled={isProcessing || !customAmount || parseFloat(customAmount) <= 0}
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Camera/Scanner screen
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Scan QR Code
        </CardTitle>
        <CardDescription>
          Point your camera at a MezoFi payment QR code
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Camera View */}
        {isScanning ? (
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
              </div>
            </div>
            
            {/* Scanning Line Animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-0.5 bg-blue-500 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-3">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="text-sm text-muted-foreground">
                Camera not active
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Control Buttons */}
        <div className="flex gap-2">
          {isScanning ? (
            <Button onClick={stopCamera} variant="outline" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          ) : (
            <Button onClick={startCamera} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          )}
          
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Allow camera access when prompted</p>
          <p>• Hold steady and center the QR code in the frame</p>
          <p>• Ensure good lighting for best results</p>
          <p>• Only MezoFi payment QR codes are supported</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default QRScanner;