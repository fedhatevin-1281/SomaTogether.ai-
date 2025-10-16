import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  Search, 
  Upload, 
  Download, 
  FileText, 
  Image, 
  Video, 
  Folder,
  MoreVertical,
  Eye,
  Share,
  Edit,
  Trash,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Star,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialService, Material, MaterialCategory } from '../../services/materialService';
import { AssignmentService } from '../../services/assignmentService';
import { UploadDebug } from './UploadDebug';

interface MaterialsLibraryProps {
  onBack: () => void;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjectsData = await AssignmentService.getSubjects();
        setSubjects(subjectsData);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = MaterialService.validateFile(selectedFile);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      if (!title) {
        setTitle(selectedFile.name.split('.')[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !subjectId || !user?.id) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      await MaterialService.uploadMaterial(
        file,
        {
          title,
          description,
          subject_id: subjectId,
          grade_level: gradeLevel || undefined,
          difficulty_level: difficultyLevel as any,
          tags: tagArray,
          is_public: isPublic
        },
        user.id,
        (progress) => {
          console.log('Upload progress:', progress);
        }
      );

      onSuccess();
      onClose();
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setSubjectId('');
      setGradeLevel('');
      setDifficultyLevel('medium');
      setTags('');
      setIsPublic(false);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upload Material</h2>
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">File *</label>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif,.doc,.docx,.ppt,.pptx,.mp3,.wav"
              className="w-full p-2 border rounded-lg"
            />
            {file && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter material title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter material description"
              className="w-full p-2 border rounded-lg h-20 resize-none"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-2">Subject *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Grade Level</label>
            <Input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g., Grade 10, High School"
            />
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty Level</label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all">All Levels</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isPublic" className="text-sm font-medium">
              Make this material public to other teachers
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !file || !title || !subjectId}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MaterialsLibrary({ onBack }: MaterialsLibraryProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'downloads' | 'rating'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [materialsData, categoriesData] = await Promise.all([
          MaterialService.getTeacherMaterials(user.id, {
            limit: 50,
            fileType: selectedFileType === 'all' ? undefined : selectedFileType,
            search: searchTerm || undefined
          }),
          MaterialService.getCategories()
        ]);
        
        setMaterials(materialsData.materials);
        setCategories(categoriesData);
      } catch (err: any) {
        console.error('Error fetching materials:', err);
        setError(err.message || 'Failed to load materials');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, searchTerm, selectedFileType]);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return <FileText className="h-8 w-8 text-red-500" />;
      case 'video': return <Video className="h-8 w-8 text-blue-500" />;
      case 'image': return <Image className="h-8 w-8 text-green-500" />;
      case 'document': return <FileText className="h-8 w-8 text-orange-500" />;
      case 'audio': return <FileText className="h-8 w-8 text-purple-500" />;
      default: return <FileText className="h-8 w-8 text-slate-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDownload = async (material: Material) => {
    try {
      // Record download usage
      if (user?.id) {
        await MaterialService.recordUsage(material.id, user.id, 'download');
      }
      
      // Open download URL
      if (material.download_url) {
        window.open(material.download_url, '_blank');
      }
    } catch (err) {
      console.error('Error downloading material:', err);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }

    try {
      await MaterialService.deleteMaterial(materialId);
      setMaterials(materials.filter(m => m.id !== materialId));
    } catch (err: any) {
      console.error('Error deleting material:', err);
      alert('Failed to delete material: ' + err.message);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'all' || 
      material.categories?.some(cat => cat.id === selectedCategory);
    return matchesCategory;
  });

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'downloads':
        aValue = a.download_count;
        bValue = b.download_count;
        break;
      case 'rating':
        aValue = a.rating_average;
        bValue = b.rating_average;
        break;
      default:
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading materials...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Materials</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Materials Library</h1>
            <p className="text-slate-600">Organize and share your teaching resources</p>
          </div>
        </div>
        <Button 
          className="bg-green-500 hover:bg-green-600"
          onClick={() => setShowUploadModal(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Material
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Categories</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-green-50 border border-green-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">All Materials</span>
                </div>
                <Badge variant="secondary">{materials.length}</Badge>
              </div>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full p-3 text-left rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-green-50 border border-green-200'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Folder className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {materials.filter(m => m.categories?.some(cat => cat.id === category.id)).length}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search & Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="created_at">Recent</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">File Type</label>
                    <select
                      value={selectedFileType}
                      onChange={(e) => setSelectedFileType(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="image">Image</option>
                      <option value="document">Document</option>
                      <option value="audio">Audio</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Materials Grid */}
          {sortedMaterials.length === 0 ? (
            <Card className="p-12 text-center">
              <Folder className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Materials Found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || selectedFileType !== 'all' || selectedCategory !== 'all'
                  ? 'No materials match your current filters.'
                  : 'You haven\'t uploaded any materials yet. Start by uploading your first resource!'}
              </p>
              <Button 
                onClick={() => setShowUploadModal(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Material
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedMaterials.map((material) => (
                <Card key={material.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(material.file_type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{material.title}</h3>
                        <p className="text-xs text-slate-500">{formatFileSize(material.file_size_bytes)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {material.is_public && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Public
                        </Badge>
                      )}
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {material.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">{material.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{formatDate(material.created_at)}</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>{material.download_count}</span>
                        </div>
                        {material.rating_count > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{material.rating_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs capitalize">
                        {material.file_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {material.difficulty_level}
                      </Badge>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(material.download_url, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDownload(material)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="h-6 w-6 mb-2" />
                <span className="text-sm">Upload Material</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => setShowUploadModal(true)}
              >
                <Video className="h-6 w-6 mb-2" />
                <span className="text-sm">Upload Video</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => setShowUploadModal(true)}
              >
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-sm">Upload Document</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => setShowUploadModal(true)}
              >
                <Image className="h-6 w-6 mb-2" />
                <span className="text-sm">Upload Image</span>
              </Button>
            </div>
          </Card>

          {/* Debug Information - Remove this after fixing upload */}
          <UploadDebug />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          // Refresh materials list
          window.location.reload();
        }}
      />
    </div>
  );
}