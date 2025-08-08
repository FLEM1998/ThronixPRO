import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Package, FileArchive, CheckCircle } from 'lucide-react';

export default function DownloadPage() {
  const [downloads, setDownloads] = useState<string[]>([]);

  const downloadFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/download/${filename}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloads(prev => [...prev, filename]);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  const packages = [
    {
      name: 'Complete ThronixPRO Platform',
      filename: 'thronixpro-everything.zip',
      size: '313MB',
      description: 'Complete platform with all dependencies and infrastructure files',
      icon: <Package className="h-6 w-6" />
    },
    {
      name: 'Source Code Only',
      filename: 'thronixpro-source-code.tar.gz',
      size: '303KB',
      description: 'Essential source code without heavy dependencies',
      icon: <FileArchive className="h-6 w-6" />
    }
  ];

  const parts = Array.from({ length: 7 }, (_, i) => ({
    name: `Part ${i + 1}`,
    filename: `thronixpro-part-a${String.fromCharCode(97 + i)}`,
    size: '50MB',
    description: `Split archive part ${i + 1} of 7`
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ThronixPRO Download Center</h1>
        <p className="text-muted-foreground">
          Download your complete cryptocurrency trading platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Complete Packages
            </CardTitle>
            <CardDescription>
              Full platform packages ready for deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.filename} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {pkg.icon}
                  <div>
                    <h3 className="font-medium">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    <p className="text-xs text-muted-foreground">{pkg.size}</p>
                  </div>
                </div>
                <Button
                  onClick={() => downloadFile(pkg.filename)}
                  disabled={downloads.includes(pkg.filename)}
                  className="flex items-center gap-2"
                >
                  {downloads.includes(pkg.filename) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {downloads.includes(pkg.filename) ? 'Downloaded' : 'Download'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5" />
              Split Archive Parts
            </CardTitle>
            <CardDescription>
              Download in smaller parts if having issues with large files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {parts.map((part) => (
              <div key={part.filename} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{part.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">({part.size})</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadFile(part.filename)}
                  disabled={downloads.includes(part.filename)}
                >
                  {downloads.includes(part.filename) ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
            <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted rounded">
              <strong>Note:</strong> After downloading all parts, use: <code>cat thronixpro-part-* &gt; thronixpro-complete.zip</code> to reassemble.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What's Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Core Platform</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• React TypeScript frontend</li>
                <li>• Express.js backend with security</li>
                <li>• Real-time WebSocket trading</li>
                <li>• PostgreSQL database schema</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Production Ready</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Docker containerization</li>
                <li>• Enterprise security features</li>
                <li>• Live exchange integrations</li>
                <li>• Complete documentation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}