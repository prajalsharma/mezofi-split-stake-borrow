"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, QrCode, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export interface QRData {
  version: string;
  type: string;
  userId: number;
  userName: string;
  userAddress: string;
  defaultAmountFiat?: number;
  fiatCurrency?: string;
  expiresAt: string;
  timestamp: string;
}

export interface QRGeneratorProps {
  userId: number;
  userName: string;
  userAddress: string;
  onQRGenerated?: (qrData: QRData, qrString: string) => void;
}

export function QRGenerator({ userId, userName, userAddress, onQRGenerated }: QRGeneratorProps) {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [qrData, setQRData] = useState<QRData | null>(null);
  const [qrString, setQRString] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeDataUrl, setQRCodeDataUrl] = useState<string>('');

  const supportedCurrencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];

  const generateQR = async () => {
    setIsGenerating(true);
    
    try {
      // Generate QR data
      const newQRData: QRData = {
        version: '1.0',
        type: 'mezofi_pay',
        userId,
        userName,
        userAddress,
        defaultAmountFiat: amount ? parseFloat(amount) : undefined,
        fiatCurrency: currency,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        timestamp: new Date().toISOString()
      };

      const qrStringValue = JSON.stringify(newQRData);
      
      setQRData(newQRData);
      setQRString(qrStringValue);
      
      // Generate QR code image
      await generateQRCodeImage(qrStringValue);
      
      // Notify parent component
      onQRGenerated?.(newQRData, qrStringValue);
      
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQRCodeImage = async (data: string) => {
    // TODO: Implement actual QR code generation
    /*
    // Using qrcode library
    import QRCode from 'qrcode';
    
    try {
      const qrDataUrl = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQRCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('QR code image generation error:', error);
    }
    */

    // Mock QR code for development - generate SVG
    const mockSvg = `
      <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="256" height="256" fill="white"/>
        <rect x="32" y="32" width="192" height="192" fill="black"/>
        <rect x="48" y="48" width="160" height="160" fill="white"/>
        <rect x="64" y="64" width="32" height="32" fill="black"/>
        <rect x="160" y="64" width="32" height="32" fill="black"/>
        <rect x="64" y="160" width="32" height="32" fill="black"/>
        <rect x="112" y="112" width="32" height="32" fill="black"/>
        <text x="128" y="140" text-anchor="middle" font-family="monospace" font-size="8" fill="white">MezoFi</text>
      </svg>
    `;
    
    const blob = new Blob([mockSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setQRCodeDataUrl(url);
  };

  const copyToClipboard = async () => {
    if (!qrString) return;
    
    try {
      await navigator.clipboard.writeText(qrString);
      toast.success('QR data copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy QR data');
    }
  };

  const downloadQR = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `mezofi-payment-qr-${userId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code downloaded!');
  };

  const refreshQR = () => {
    if (qrData) {
      generateQR();
    }
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursRemaining = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60)));
    const minutesRemaining = Math.max(0, Math.floor(((expiry.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)));
    
    if (hoursRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining}m remaining`;
    } else {
      return `${minutesRemaining}m remaining`;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Payment QR Code
        </CardTitle>
        <CardDescription>
          Generate a QR code for receiving payments
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Receiving as:</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{userName}</Badge>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
            </code>
          </div>
        </div>

        {/* Amount Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Default Amount (Optional)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
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
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateQR} 
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <QrCode className="h-4 w-4 mr-2" />
          )}
          Generate QR Code
        </Button>

        {/* QR Code Display */}
        {qrData && qrCodeDataUrl && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex justify-center">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Payment QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            {/* QR Info */}
            <div className="space-y-2 text-sm">
              {qrData.defaultAmountFiat && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Default Amount:</span>
                  <span className="font-medium">
                    {supportedCurrencies.find(c => c.code === qrData.fiatCurrency)?.symbol}
                    {qrData.defaultAmountFiat} {qrData.fiatCurrency}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium text-orange-600">
                  {formatExpiryTime(qrData.expiresAt)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated:</span>
                <span className="font-medium">
                  {new Date(qrData.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={copyToClipboard}
                className="flex-1"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Data
              </Button>
              
              <Button 
                variant="outline" 
                onClick={downloadQR}
                className="flex-1"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button 
                variant="outline" 
                onClick={refreshQR}
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Share this QR code to receive payments</p>
          <p>• Payers can scan with MezoFi app or any QR scanner</p>
          <p>• QR codes expire after 24 hours for security</p>
          {!qrData?.defaultAmountFiat && (
            <p>• Payers will be prompted to enter amount</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default QRGenerator;