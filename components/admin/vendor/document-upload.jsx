import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, Download, CheckCircle, XCircle } from 'lucide-react';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';

const DocumentUpload = ({ 
  document, 
  documentType, 
  title, 
  required = false, 
  numberField = null,
  numberFieldName = '',
  onDocumentChange,
  onNumberChange,
  disabled = false 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { uploadDocument, deleteDocument, uploadState } = useDocumentUpload();

  const uploadKey = `${documentType}_upload`;
  const currentUpload = uploadState[uploadKey];

  // Document type options based on documentType
  const getDocumentTypeOptions = () => {
    if (documentType === 'identity') {
      return [
        { value: 'driving_license', label: 'Driving License' },
        { value: 'aadhar_card', label: 'Aadhar Card' },
        { value: 'voter_card', label: 'Voter Card' }
      ];
    } else if (documentType === 'business') {
      return [
        { value: 'gst', label: 'GST Certificate' },
        { value: 'msme', label: 'MSME Certificate' },
        { value: 'other', label: 'Other Business Document' }
      ];
    }
    return [];
  };

  const documentTypeOptions = getDocumentTypeOptions();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const uploadedFile = await uploadDocument(selectedFile, title, 'vendor-documents');
    if (uploadedFile) {
      onDocumentChange({
        ...document,
        docImageUrl: uploadedFile.publicUrl
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDocumentTypeChange = (value) => {
    onDocumentChange({
      ...document,
      type: value
    });
  };

  const handleNumberChange = (e) => {
    const value = e.target.value;
    if (onNumberChange) {
      onNumberChange(value);
    }
    onDocumentChange({
      ...document,
      number: value
    });
  };

  const handleRemoveDocument = () => {
    onDocumentChange({
      ...document,
      docImageUrl: ''
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {title}
          {required && <span className="text-red-500">*</span>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Document Type Selection */}
        {documentTypeOptions.length > 0 && (
          <div className="space-y-2">
            <Label>Document Type {required && <span className="text-red-500">*</span>}</Label>
            <Select 
              value={document?.type || ''} 
              onValueChange={handleDocumentTypeChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Document Number */}
        {numberField && (
          <div className="space-y-2">
            <Label>{numberFieldName} {required && <span className="text-red-500">*</span>}</Label>
            <Input
              placeholder={`Enter ${numberFieldName.toLowerCase()}`}
              value={document?.number || ''}
              onChange={handleNumberChange}
              disabled={disabled}
            />
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-2">
          <Label>Document Upload {required && <span className="text-red-500">*</span>}</Label>
          
          {!document?.docImageUrl && !selectedFile && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
                disabled={disabled}
              />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Choose File
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                PNG, JPG, WebP or PDF up to 5MB
              </p>
            </div>
          )}

          {/* Preview */}
          {(selectedFile || document?.docImageUrl) && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {selectedFile ? selectedFile.name : 'Document uploaded'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectedFile ? () => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    } : handleRemoveDocument}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Upload button for selected file */}
              {selectedFile && !currentUpload?.loading && (
                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={handleUpload}
                    size="sm"
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              )}

              {/* Upload progress */}
              {currentUpload?.loading && (
                <div className="mt-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}

              {/* Preview image */}
              {previewUrl && (
                <div className="mt-3">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        {document?.docImageUrl && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-green-600 border-green-200">
              Document Uploaded
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload; 