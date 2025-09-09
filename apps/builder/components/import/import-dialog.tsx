'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileType,
  FileCode2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
  Eye,
  Import,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formsApi } from '@/lib/api/forms';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const router = useRouter();
  const [importType, setImportType] = useState<'typeform' | 'google_forms'>('typeform');
  const [source, setSource] = useState('');
  const [credentials, setCredentials] = useState({ access_token: '' });
  const [preview, setPreview] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Validate source
  const validateMutation = useMutation({
    mutationFn: (data: { type: string; source: string }) =>
      formsApi.validateImport(data),
    onSuccess: (data) => {
      setValidationResult(data);
    },
  });

  // Preview import
  const previewMutation = useMutation({
    mutationFn: (data: { type: string; source: string; credentials?: any }) =>
      formsApi.previewImport(data),
    onSuccess: (data) => {
      setPreview(data.preview);
    },
  });

  // Perform import
  const importMutation = useMutation({
    mutationFn: (data: { type: string; source: string; credentials?: any }) =>
      formsApi.importForm(data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Form imported successfully!');
        router.push(`/forms/${data.form_id}/edit`);
        onOpenChange(false);
      } else {
        toast.error('Import completed with warnings');
      }
    },
    onError: () => {
      toast.error('Failed to import form');
    },
  });

  const handleSourceChange = (value: string) => {
    setSource(value);
    setValidationResult(null);
    setPreview(null);

    // Auto-validate when URL is pasted
    if (value.startsWith('http')) {
      validateMutation.mutate({ type: importType, source: value });
    }
  };

  const handlePreview = () => {
    const data = {
      type: importType,
      source,
      credentials: importType === 'typeform' ? credentials : undefined,
    };
    previewMutation.mutate(data);
  };

  const handleImport = () => {
    const data = {
      type: importType,
      source,
      credentials: importType === 'typeform' ? credentials : undefined,
    };
    importMutation.mutate(data);
  };

  const renderImportContent = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="source">
            {importType === 'typeform' ? 'Typeform URL or ID' : 'Google Forms URL or ID'}
          </Label>
          <Input
            id="source"
            placeholder={
              importType === 'typeform'
                ? 'https://form.typeform.com/to/abcdef or abcdef'
                : 'https://docs.google.com/forms/d/abc123/edit'
            }
            value={source}
            onChange={(e) => handleSourceChange(e.target.value)}
          />
          {validationResult && (
            <div className="flex items-center gap-2 text-sm">
              {validationResult.valid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">{validationResult.message}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{validationResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>

        {importType === 'typeform' && (
          <div className="space-y-2">
            <Label htmlFor="access_token">Personal Access Token</Label>
            <Input
              id="access_token"
              type="password"
              placeholder="Your Typeform access token"
              value={credentials.access_token}
              onChange={(e) =>
                setCredentials({ ...credentials, access_token: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Get your token from Typeform account settings → Personal tokens
            </p>
          </div>
        )}

        {importType === 'google_forms' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll be redirected to Google to authorize access to your forms
            </AlertDescription>
          </Alert>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Title:</span>{' '}
                  <span className="font-medium">{preview.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pages:</span>{' '}
                  <span className="font-medium">{preview.page_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Questions:</span>{' '}
                  <span className="font-medium">{preview.field_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Logic:</span>{' '}
                  {preview.has_logic ? (
                    <Badge variant="default" className="text-xs">Yes</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">No</Badge>
                  )}
                </div>
              </div>

              {preview.field_types && Object.keys(preview.field_types).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Field Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(preview.field_types).map(([type, count]) => (
                      <Badge key={type} variant="outline">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {preview.warnings && preview.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Import Warnings:</p>
                  <ul className="list-disc list-inside text-sm">
                    {preview.warnings.slice(0, 5).map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                    {preview.warnings.length > 5 && (
                      <li>...and {preview.warnings.length - 5} more warnings</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Form</DialogTitle>
          <DialogDescription>
            Import your existing forms from Typeform or Google Forms
          </DialogDescription>
        </DialogHeader>

        <Tabs value={importType} onValueChange={(v: any) => setImportType(v)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="typeform" className="gap-2">
              <FileType className="h-4 w-4" />
              Typeform
            </TabsTrigger>
            <TabsTrigger value="google_forms" className="gap-2">
              <FileCode2 className="h-4 w-4" />
              Google Forms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="typeform" className="mt-4">
            {renderImportContent()}
          </TabsContent>

          <TabsContent value="google_forms" className="mt-4">
            {renderImportContent()}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!preview ? (
            <Button
              onClick={handlePreview}
              disabled={
                !source ||
                !validationResult?.valid ||
                (importType === 'typeform' && !credentials.access_token) ||
                previewMutation.isPending
              }
            >
              {previewMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Import className="h-4 w-4 mr-2" />
                  Import Form
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}