import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Image as ImageIcon, Trash2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Files = () => {
  const { token } = useAuth();
  const { activeAgency } = useAgency();
  const [files, setFiles] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [category, setCategory] = useState('agency');
  const [relatedId, setRelatedId] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (activeAgency) {
      fetchFiles();
      fetchCars();
    }
  }, [activeAgency]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/files/?agency_id=${activeAgency.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/cars/?agency_id=${activeAgency.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  {/*codigo nuevo para carro*/}
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecciona al menos un archivo');
      return;
    }

    if (category === 'car' && !relatedId) {
      toast.error('Debes seleccionar un auto para asociar el archivo');
      return;
    }

    setUploading(true);
       
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('agency_id', activeAgency.id);
        formData.append('category', category);
        if (relatedId) {
          formData.append('related_id', relatedId);
        }
        
        await axios.post(`${API_URL}/api/files/upload`,formData,{
           headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
           },
        });
      }

      toast.success(`${selectedFiles.length} archivo(s) subido(s) exitosamente`);
      setSelectedFiles([]);
      setUploadDialogOpen(false);
      fetchFiles();
      
      // Refresh cars if uploaded to a car
      if (category === 'car') {
        fetchCars();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/files/${fileId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Archivo eliminado');
      fetchFiles();
      fetchCars();
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const getFileUrl = (file) => {
    return `${API_URL}${file.file_url}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!activeAgency) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay agencia seleccionada</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="files-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Media Center</h1>
            <p className="text-muted-foreground mt-2">Gestiona archivos, imágenes y documentos</p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="upload-file-btn">
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Subir Archivos</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agency">Agencia</SelectItem>
                      <SelectItem value="car">Auto</SelectItem>
                      <SelectItem value="promotion">Promoción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Related Car Selection */}
                {category === 'car' && (
                  <div className="space-y-2">
                    <Label>Auto</Label>
                    
                    {cars.length === 0 ? (
                      <Alert variant="destructive">
                         <AlertDescription>
                            No existen autos en esta agencia. Debes crear un auto antes de subir archivos.
                         </AlertDescription>
                      </Alert>
                    ) : (
                      
                      <Select value={relatedId} onValueChange={setRelatedId}>
                        <SelectTrigger>
                           <SelectValue placeholder="Seleccionar auto" />
                        </SelectTrigger>
                        <SelectContent>
                           {cars.map((car) => (
                             <SelectItem key={car.id} value={car.id}>
                                {car.brand} {car.model} {car.year}
                             </SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}


                {/* Drag & Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-2">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Máximo 5MB por archivo. Formatos: JPG, PNG, WEBP, PDF
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                  />
                  <Label htmlFor="file-input">
                    <Button type="button" variant="outline" asChild>
                      <span>Seleccionar Archivos</span>
                    </Button>
                  </Label>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Archivos Seleccionados ({selectedFiles.length})</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Alert>
                  <AlertDescription className="text-xs">
                    Los archivos subidos estarán disponibles para que el asistente IA los comparta por WhatsApp.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      uploading ||
                      selectedFiles.length === 0 ||
                      (category === 'car' && !relatedId)
                    }
                  >
                    {uploading ? 'Subiendo...' : `Subir ${selectedFiles.length} Archivo(s)`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Files Grid */}
        {loading ? (
          <div className="text-center py-12">Cargando archivos...</div>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay archivos subidos. Haz clic en "Subir Archivos" para comenzar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden" data-testid={`file-card-${file.id}`}>
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {file.file_type === 'image' ? (
                    <img
                      src={getFileUrl(file)}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePreview(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate mb-1">{file.filename}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {file.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewFile?.filename}</DialogTitle>
            </DialogHeader>
            {previewFile && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                  {previewFile.file_type === 'image' ? (
                    <img
                      src={getFileUrl(previewFile)}
                      alt={previewFile.filename}
                      className="max-w-full max-h-[600px] object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <FileText className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Vista previa de PDF no disponible
                      </p>
                      <Button asChild>
                        <a href={getFileUrl(previewFile)} target="_blank" rel="noopener noreferrer">
                          Abrir PDF
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Categoría</p>
                    <Badge>{previewFile.category}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tamaño</p>
                    <p className="font-medium">{formatFileSize(previewFile.file_size)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Files;
