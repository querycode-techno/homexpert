import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, Eye, Download, CheckCircle, XCircle } from 'lucide-react';
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
        imageUrl: uploadedFile.publicUrl
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (document?.imageUrl) {
      const success = await deleteDocument(document.imageUrl, title);
      if (success) {
        onDocumentChange({
          ...document,
          imageUrl: ''
        });
      }
    }
  };

  const handleNumberChange = (event) => {
    if (onNumberChange) {
      onNumberChange(event.target.value);
    }
  };

  const getFileIcon = (url) => {
    if (!url) return null;
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      return '🖼️';
    } else if (extension === 'pdf') {
      return '📄';
    }
    return '📎';
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          {required && <span className="text-red-500">*</span>}
          {document?.verified && (
            <Badge variant="secondary" className="text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {document?.imageUrl && !document?.verified && (
            <Badge variant="outline" className="text-yellow-600">
              <XCircle className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Number Field */}
        {numberField && (
          <div className="space-y-2">
            <Label htmlFor={`${documentType}-number`} className="text-sm">
              {numberFieldName}
            </Label>
            <Input
              id={`${documentType}-number`}
              type="text"
              value={document?.[numberField] || ''}
              onChange={handleNumberChange}
              placeholder={`Enter ${numberFieldName.toLowerCase()}`}
              disabled={disabled}
            />
          </div>
        )}

        {/* File Upload Section */}
        <div className="space-y-3">
          <Label className="text-sm">Document Upload</Label>
          
          {/* Current Document */}
          {document?.imageUrl && !selectedFile && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                 <span className="text-lg">{getFileIcon(document.imageUrl)}</span>
               </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(document.imageUrl, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = document.imageUrl;
                      link.download = `${title}_${Date.now()}`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* File Selection */}
          {!disabled && (
            <div className="space-y-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {/* Preview */}
              {selectedFile && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Selected:</span>
                      <span className="text-sm text-gray-600">{selectedFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Image Preview */}
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full h-32 object-contain border rounded"
                      />
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="mt-3">
                    <Button
                      type="button"
                      onClick={handleUpload}
                      disabled={currentUpload?.loading}
                      className="w-full"
                    >
                      {currentUpload?.loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Progress/Status */}
        {currentUpload?.loading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        )}

        {currentUpload?.error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Error: {currentUpload.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload; 